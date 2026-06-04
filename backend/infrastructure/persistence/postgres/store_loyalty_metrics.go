package postgres

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StoreLoyaltyMetrics aggregates loyalty activity from point_events for merchant dashboards.
type StoreLoyaltyMetrics struct {
	Pool *pgxpool.Pool
}

// TenantSummary returns dashboard aggregates for merchant admin KPIs (legacy).
func (r *StoreLoyaltyMetrics) TenantSummary(ctx context.Context, tenantID uuid.UUID) (ports.TenantDashboardMetrics, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT
  COALESCE(SUM(GREATEST(delta, 0)), 0)::bigint,
  COALESCE(COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)), 0)::bigint,
  COALESCE(COUNT(DISTINCT enrollment_id) FILTER (
    WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP) AND enrollment_id IS NOT NULL
  ), 0)::bigint,
  COALESCE(SUM(GREATEST(delta, 0)) FILTER (WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP)), 0)::bigint,
  COALESCE(COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP) AND event_type = 'redeem'
  ), 0)::bigint,
  (
    SELECT COUNT(*)::bigint FROM loyalty_enrollments
    WHERE tenant_id = $1 AND created_at >= date_trunc('day', CURRENT_TIMESTAMP)
  )
FROM point_events
WHERE tenant_id = $1`
	var out ports.TenantDashboardMetrics
	err := db.QueryRow(ctx, q, tenantID).Scan(
		&out.PointsDistributed,
		&out.PointEventsThisMonth,
		&out.ClientsServedToday,
		&out.PointsIssuedToday,
		&out.RedemptionsToday,
		&out.NewEnrollmentsToday,
	)
	return out, err
}

func (r *StoreLoyaltyMetrics) TenantMetrics(ctx context.Context, in ports.TenantMetricsInput) (ports.TenantMetricsResult, error) {
	duration := in.To.Sub(in.From)
	prevFrom := in.From.Add(-duration)
	prevTo := in.From

	scope := "all"
	if in.LocationID != nil {
		scope = "location"
	}

	points, _ := r.sumPointsDistributed(ctx, in.TenantID, in.From, in.To, in.LocationID)
	prevPoints, _ := r.sumPointsDistributed(ctx, in.TenantID, prevFrom, prevTo, in.LocationID)

	customers, _ := r.countActiveCustomers(ctx, in.TenantID, in.From, in.To, in.LocationID)
	prevCustomers, _ := r.countActiveCustomers(ctx, in.TenantID, prevFrom, prevTo, in.LocationID)

	redeems, _ := r.countRedemptions(ctx, in.TenantID, in.From, in.To, in.LocationID)
	prevRedeems, _ := r.countRedemptions(ctx, in.TenantID, prevFrom, prevTo, in.LocationID)

	retention, _ := r.retentionRate(ctx, in.TenantID, in.From, in.To, in.LocationID)
	prevRetention, _ := r.retentionRate(ctx, in.TenantID, prevFrom, prevTo, in.LocationID)

	pointsSpark, _ := r.dailyPointsSparkline(ctx, in.TenantID, in.From, in.To, in.LocationID)
	customersSpark, _ := r.dailyActiveCustomersSparkline(ctx, in.TenantID, in.From, in.To, in.LocationID)
	redeemsSpark, _ := r.dailyRedemptionsSparkline(ctx, in.TenantID, in.From, in.To, in.LocationID)
	retentionSpark, _ := r.dailyRetentionSparkline(ctx, in.TenantID, in.From, in.To, in.LocationID)

	label := fmt.Sprintf("%dd", int(duration.Hours()/24))
	if label == "0d" {
		label = "7d"
	}

	return ports.TenantMetricsResult{
		Period: ports.TenantMetricsPeriod{From: in.From, To: in.To, Label: label},
		LocationScope: scope,
		KPIs: []ports.TenantMetricKPI{
			kpi("points_distributed", float64(points), "", points, prevPoints, pointsSpark),
			kpi("active_customers", float64(customers), "", customers, prevCustomers, customersSpark),
			kpi("rewards_validated", float64(redeems), "", redeems, prevRedeems, redeemsSpark),
			kpiFloat("retention_rate", retention, prevRetention, "%", retentionSpark),
		},
	}, nil
}

func kpi(key string, value float64, unit string, cur, prev int64, spark []int64) ports.TenantMetricKPI {
	delta := deltaPct(cur, prev)
	return ports.TenantMetricKPI{
		Key:       key,
		Value:     value,
		Unit:      unit,
		DeltaPct:  delta,
		TrendUp:   delta >= 0,
		Sparkline: spark,
	}
}

func kpiFloat(key string, value, prev float64, unit string, spark []int64) ports.TenantMetricKPI {
	var delta float64
	if prev == 0 {
		if value != 0 {
			delta = 100
		}
	} else {
		delta = math.Round((value-prev)/prev*1000) / 10
	}
	return ports.TenantMetricKPI{
		Key:       key,
		Value:     value,
		Unit:      unit,
		DeltaPct:  delta,
		TrendUp:   delta >= 0,
		Sparkline: spark,
	}
}

func deltaPct(cur, prev int64) float64 {
	if prev == 0 {
		if cur == 0 {
			return 0
		}
		return 100
	}
	return math.Round((float64(cur-prev)/float64(prev))*1000) / 10
}

func (r *StoreLoyaltyMetrics) TenantLoyaltyActivity(ctx context.Context, in ports.TenantMetricsInput) (ports.TenantLoyaltyActivityResult, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
  COALESCE(SUM(GREATEST(delta, 0)), 0)::bigint AS distributed,
  COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN ABS(delta) ELSE 0 END), 0)::bigint AS rewarded
FROM point_events
WHERE tenant_id = $1
  AND created_at >= $2 AND created_at < $3
  AND ($4::uuid IS NULL OR location_id = $4)
GROUP BY 1
ORDER BY 1`
	rows, err := db.Query(ctx, q, in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return ports.TenantLoyaltyActivityResult{}, err
	}
	defer rows.Close()

	var series []ports.TenantLoyaltyActivityPoint
	for rows.Next() {
		var day time.Time
		var dist, rew int64
		if err := rows.Scan(&day, &dist, &rew); err != nil {
			return ports.TenantLoyaltyActivityResult{}, err
		}
		series = append(series, ports.TenantLoyaltyActivityPoint{
			Date:              day.UTC(),
			Label:             day.UTC().Format("Mon"),
			PointsDistributed: dist,
			PointsRewarded:    rew,
		})
	}
	if err := rows.Err(); err != nil {
		return ports.TenantLoyaltyActivityResult{}, err
	}

	label := fmt.Sprintf("%dd", int(in.To.Sub(in.From).Hours()/24))
	return ports.TenantLoyaltyActivityResult{
		Period: ports.TenantMetricsPeriod{From: in.From, To: in.To, Label: label},
		Series: series,
	}, nil
}

func (r *StoreLoyaltyMetrics) TenantNavStats(ctx context.Context, tenantID uuid.UUID) (ports.TenantNavStats, error) {
	db := pickDB(ctx, r.Pool)
	var out ports.TenantNavStats
	err := db.QueryRow(ctx, `
SELECT
  (SELECT count(*) FROM loyalty_enrollments WHERE tenant_id = $1),
  (SELECT count(*) FROM locations WHERE tenant_id = $1),
  (SELECT count(*) FROM tenant_memberships WHERE tenant_id = $1 AND status = 'active'),
  (SELECT count(*) FROM points_rules WHERE tenant_id = $1 AND active = true),
  (SELECT count(*) FROM rewards WHERE tenant_id = $1 AND active = true)
`, tenantID).Scan(&out.Customers, &out.Locations, &out.TeamMembers, &out.RulesActive, &out.RewardsActive)
	out.Campaigns = 0
	return out, err
}

func (r *StoreLoyaltyMetrics) sumPointsDistributed(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT COALESCE(SUM(GREATEST(delta, 0)), 0)::bigint
FROM point_events
WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
  AND ($4::uuid IS NULL OR location_id = $4)`
	var n int64
	err := db.QueryRow(ctx, q, tenantID, from, to, locationID).Scan(&n)
	return n, err
}

func (r *StoreLoyaltyMetrics) countActiveCustomers(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT COALESCE(COUNT(DISTINCT enrollment_id), 0)::bigint
FROM point_events
WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
  AND enrollment_id IS NOT NULL
  AND ($4::uuid IS NULL OR location_id = $4)`
	var n int64
	err := db.QueryRow(ctx, q, tenantID, from, to, locationID).Scan(&n)
	return n, err
}

func (r *StoreLoyaltyMetrics) countRedemptions(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT COALESCE(COUNT(*), 0)::bigint
FROM point_events
WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
  AND event_type = 'redeem'
  AND ($4::uuid IS NULL OR location_id = $4)`
	var n int64
	err := db.QueryRow(ctx, q, tenantID, from, to, locationID).Scan(&n)
	return n, err
}

// retentionRate = share of customers active in previous window who also had activity in current window.
func (r *StoreLoyaltyMetrics) retentionRate(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) (float64, error) {
	duration := to.Sub(from)
	prevFrom := from.Add(-duration)
	db := pickDB(ctx, r.Pool)
	const q = `
WITH prev AS (
  SELECT DISTINCT enrollment_id FROM point_events
  WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
    AND enrollment_id IS NOT NULL
    AND ($6::uuid IS NULL OR location_id = $6)
),
curr AS (
  SELECT DISTINCT enrollment_id FROM point_events
  WHERE tenant_id = $1 AND created_at >= $4 AND created_at < $5
    AND enrollment_id IS NOT NULL
    AND ($6::uuid IS NULL OR location_id = $6)
)
SELECT CASE WHEN (SELECT count(*) FROM prev) = 0 THEN 0
       ELSE (SELECT count(*) FROM prev p JOIN curr c ON c.enrollment_id = p.enrollment_id)::float
            / (SELECT count(*) FROM prev)::float * 100
       END`
	var rate float64
	err := db.QueryRow(ctx, q, tenantID, prevFrom, from, from, to, locationID).Scan(&rate)
	return rate, err
}

func (r *StoreLoyaltyMetrics) dailyPointsSparkline(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]int64, error) {
	return r.dailyAggregate(ctx, tenantID, from, to, locationID, `COALESCE(SUM(GREATEST(delta, 0)), 0)::bigint`)
}

func (r *StoreLoyaltyMetrics) dailyRedemptionsSparkline(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT date_trunc('day', created_at AT TIME ZONE 'UTC'), COALESCE(COUNT(*), 0)::bigint
FROM point_events
WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
  AND event_type = 'redeem'
  AND ($4::uuid IS NULL OR location_id = $4)
GROUP BY 1 ORDER BY 1`
	rows, err := db.Query(ctx, q, tenantID, from, to, locationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSparklineRows(rows)
}

func scanSparklineRows(rows pgxRows) ([]int64, error) {
	var out []int64
	for rows.Next() {
		var day time.Time
		var v int64
		if err := rows.Scan(&day, &v); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

type pgxRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}

func (r *StoreLoyaltyMetrics) dailyActiveCustomersSparkline(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]int64, error) {
	return r.dailyAggregate(ctx, tenantID, from, to, locationID, `COALESCE(COUNT(DISTINCT enrollment_id), 0)::bigint`)
}

func (r *StoreLoyaltyMetrics) dailyRetentionSparkline(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]int64, error) {
	return r.dailyActiveCustomersSparkline(ctx, tenantID, from, to, locationID)
}

func (r *StoreLoyaltyMetrics) dailyAggregate(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID, selectExpr string) ([]int64, error) {
	db := pickDB(ctx, r.Pool)
	q := fmt.Sprintf(`
SELECT date_trunc('day', created_at AT TIME ZONE 'UTC'), %s
FROM point_events
WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3
  AND ($4::uuid IS NULL OR location_id = $4)
GROUP BY 1
ORDER BY 1`, selectExpr)
	rows, err := db.Query(ctx, q, tenantID, from, to, locationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSparklineRows(rows)
}
