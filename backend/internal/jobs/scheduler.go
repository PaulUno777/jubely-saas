package jobs

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	dormantAfterDays     = 30
	campaignTickInterval = time.Minute
	dailyJobInterval     = 24 * time.Hour
)

// Runner executes periodic background maintenance tasks.
type Runner struct {
	Pool      *pgxpool.Pool
	Campaigns ports.CampaignRepository
	Analytics ports.AnalyticsRepository
	Clock     ports.Clock
}

func (r *Runner) Start(ctx context.Context) {
	if r == nil || r.Pool == nil {
		return
	}
	go r.loop(ctx, campaignTickInterval, r.runCampaignScheduler)
	go r.loop(ctx, dailyJobInterval, r.runDailyJobs)
}

func (r *Runner) loop(ctx context.Context, every time.Duration, fn func(context.Context)) {
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			fn(ctx)
		}
	}
}

func (r *Runner) runCampaignScheduler(ctx context.Context) {
	now := r.now()
	rows, err := r.Pool.Query(ctx, `
SELECT id, tenant_id, name, campaign_type, status, starts_at, ends_at, targeting_json, action_json,
       budget_points, reach_count, conversion_count, created_at, updated_at
FROM campaigns
WHERE (status = 'scheduled' AND starts_at IS NOT NULL AND starts_at <= $1)
   OR (status = 'live' AND ends_at IS NOT NULL AND ends_at < $1)`, now)
	if err != nil {
		log.Printf("jobs: campaign scheduler query: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var c domain.Campaign
		var targeting, action []byte
		if err := rows.Scan(
			&c.ID, &c.TenantID, &c.Name, &c.CampaignType, &c.Status, &c.StartsAt, &c.EndsAt,
			&targeting, &action, &c.BudgetPoints, &c.ReachCount, &c.ConversionCount, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			log.Printf("jobs: campaign scan: %v", err)
			continue
		}
		c.TargetingJSON = targeting
		c.ActionJSON = action
		switch c.Status {
		case domain.CampaignStatusScheduled:
			c.Status = domain.CampaignStatusLive
		case domain.CampaignStatusLive:
			c.Status = domain.CampaignStatusEnded
		}
		c.UpdatedAt = now
		if r.Campaigns != nil {
			if err := r.Campaigns.Update(ctx, &c); err != nil {
				log.Printf("jobs: campaign update %s: %v", c.ID, err)
			}
		}
	}
}

func (r *Runner) runDailyJobs(ctx context.Context) {
	r.markDormantEnrollments(ctx)
	r.rollupAnalytics(ctx)
}

func (r *Runner) markDormantEnrollments(ctx context.Context) {
	now := r.now()
	_, err := r.Pool.Exec(ctx, `
UPDATE loyalty_enrollments
SET status = 'dormant'
WHERE status = 'active'
  AND (
    (last_interaction_at IS NOT NULL AND last_interaction_at < $1 - ($2::int || ' days')::interval)
    OR (last_interaction_at IS NULL AND created_at < $1 - ($2::int || ' days')::interval)
  )`, now, dormantAfterDays)
	if err != nil {
		log.Printf("jobs: dormant detector: %v", err)
	}
}

func (r *Runner) rollupAnalytics(ctx context.Context) {
	if r.Analytics == nil {
		return
	}
	day := r.now().UTC().AddDate(0, 0, -1)
	dayStart := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24*time.Hour - time.Nanosecond)

	tenantRows, err := r.Pool.Query(ctx, `SELECT id FROM tenants WHERE active=true`)
	if err != nil {
		log.Printf("jobs: analytics rollup tenants: %v", err)
		return
	}
	defer tenantRows.Close()

	for tenantRows.Next() {
		var tenantID uuid.UUID
		if err := tenantRows.Scan(&tenantID); err != nil {
			continue
		}
		metrics, err := r.computeDayMetrics(ctx, tenantID, nil, dayStart, dayEnd)
		if err != nil {
			log.Printf("jobs: analytics metrics tenant=%s: %v", tenantID, err)
			continue
		}
		now := r.now()
		if err := r.Analytics.UpsertDailyRollup(ctx, &ports.AnalyticsDailyRollup{
			ID:         uuid.New(),
			TenantID:   tenantID,
			LocationID: nil,
			Day:        dayStart,
			Metrics:    metrics,
			CreatedAt:  now,
			UpdatedAt:  now,
		}); err != nil {
			log.Printf("jobs: analytics upsert tenant=%s: %v", tenantID, err)
		}
	}
}

func (r *Runner) computeDayMetrics(ctx context.Context, tenantID uuid.UUID, locationID *uuid.UUID, from, to time.Time) ([]byte, error) {
	var pointsIssued int64
	var purchases int64
	var enrollments int64
	args := []any{tenantID, from, to}
	locClause := ""
	if locationID != nil {
		args = append(args, *locationID)
		locClause = " AND location_id = $4"
	}
	q := `SELECT COALESCE(sum(delta),0)::bigint FROM point_events WHERE tenant_id=$1 AND created_at >= $2 AND created_at <= $3 AND delta > 0` + locClause
	if err := r.Pool.QueryRow(ctx, q, args...).Scan(&pointsIssued); err != nil {
		return nil, err
	}
	q = `SELECT count(*)::bigint FROM point_events WHERE tenant_id=$1 AND created_at >= $2 AND created_at <= $3 AND event_type='purchase'` + locClause
	if err := r.Pool.QueryRow(ctx, q, args...).Scan(&purchases); err != nil {
		return nil, err
	}
	q = `SELECT count(*)::bigint FROM loyalty_enrollments WHERE tenant_id=$1 AND created_at >= $2 AND created_at <= $3`
	if err := r.Pool.QueryRow(ctx, q, tenantID, from, to).Scan(&enrollments); err != nil {
		return nil, err
	}
	payload := map[string]any{
		"points_issued": pointsIssued,
		"purchases":     purchases,
		"enrollments":   enrollments,
	}
	return json.Marshal(payload)
}

func (r *Runner) now() time.Time {
	if r.Clock != nil {
		return r.Clock.Now().UTC()
	}
	return time.Now().UTC()
}
