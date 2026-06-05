package postgres

import (
	"context"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantAnalyticsRepository struct {
	Pool *pgxpool.Pool
}

func (r *TenantAnalyticsRepository) locationClause(alias string, locID *uuid.UUID, args *[]any) string {
	if locID == nil {
		return ""
	}
	*args = append(*args, *locID)
	return fmt.Sprintf(" AND %s.location_id = $%d", alias, len(*args))
}

func (r *TenantAnalyticsRepository) enrollmentLocationClause(locID *uuid.UUID, args *[]any) string {
	if locID == nil {
		return ""
	}
	*args = append(*args, *locID)
	return fmt.Sprintf(" AND (le.home_location_id = $%d OR le.enrollment_location_id = $%d)", len(*args), len(*args))
}

func (r *TenantAnalyticsRepository) Overview(ctx context.Context, in ports.AnalyticsDateRange) (ports.AnalyticsOverview, error) {
	db := pickDB(ctx, r.Pool)
	var out ports.AnalyticsOverview

	memberArgs := []any{in.TenantID}
	memberQ := `SELECT count(*)::bigint FROM loyalty_enrollments le WHERE le.tenant_id=$1`
	memberQ += r.enrollmentLocationClause(in.LocationID, &memberArgs)
	if err := db.QueryRow(ctx, memberQ, memberArgs...).Scan(&out.TotalMembers); err != nil {
		return out, err
	}

	dormantDays := 30
	dormantArgs := []any{in.TenantID, in.To, dormantDays}
	dormantQ := `
SELECT count(*)::bigint FROM loyalty_enrollments le
WHERE le.tenant_id=$1
  AND (
    le.status = 'dormant'
    OR (le.last_interaction_at IS NOT NULL AND le.last_interaction_at < $2::timestamptz - ($3::int || ' days')::interval)
    OR (le.last_interaction_at IS NULL AND le.created_at < $2::timestamptz - ($3::int || ' days')::interval)
  )`
	dormantQ += r.enrollmentLocationClause(in.LocationID, &dormantArgs)
	if err := db.QueryRow(ctx, dormantQ, dormantArgs...).Scan(&out.DormantMembers); err != nil {
		return out, err
	}

	peArgs := []any{in.TenantID, in.From, in.To}
	locPE := r.locationClause("pe", in.LocationID, &peArgs)
	avgBasketQ := `
SELECT COALESCE(avg((pe.payload->>'amount_fcfa')::bigint), 0)::bigint
FROM point_events pe
WHERE pe.tenant_id=$1 AND pe.created_at >= $2 AND pe.created_at <= $3
  AND pe.event_type = 'purchase'
  AND (pe.payload->>'amount_fcfa') IS NOT NULL` + locPE
	if err := db.QueryRow(ctx, avgBasketQ, peArgs...).Scan(&out.AvgBasketFcfa); err != nil {
		return out, err
	}

	var totalPts int64
	var earnEvents int64
	ptsQ := `
SELECT COALESCE(sum(pe.delta), 0)::bigint, count(*)::bigint
FROM point_events pe
WHERE pe.tenant_id=$1 AND pe.created_at >= $2 AND pe.created_at <= $3
  AND pe.delta > 0` + locPE
	if err := db.QueryRow(ctx, ptsQ, peArgs...).Scan(&totalPts, &earnEvents); err != nil {
		return out, err
	}
	if out.TotalMembers > 0 {
		out.PointsPerMember = float64(totalPts) / float64(out.TotalMembers)
	}
	weeks := in.To.Sub(in.From).Hours() / (24 * 7)
	if weeks < 1 {
		weeks = 1
	}
	if out.TotalMembers > 0 {
		out.VisitFrequencyPerWeek = float64(earnEvents) / float64(out.TotalMembers) / weeks
	}
	return out, nil
}

func (r *TenantAnalyticsRepository) MemberGrowth(ctx context.Context, in ports.AnalyticsDateRange) ([]ports.MemberGrowthPoint, error) {
	db := pickDB(ctx, r.Pool)
	args := []any{in.TenantID, in.From, in.To}
	locEnr := r.enrollmentLocationClause(in.LocationID, &args)
	q := `
SELECT date_trunc('week', le.created_at)::date AS week_start,
       count(*)::bigint AS new_members,
       0::bigint AS reactivated
FROM loyalty_enrollments le
WHERE le.tenant_id=$1 AND le.created_at >= $2 AND le.created_at <= $3` + locEnr + `
GROUP BY 1
ORDER BY 1 ASC`
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.MemberGrowthPoint
	for rows.Next() {
		var pt ports.MemberGrowthPoint
		if err := rows.Scan(&pt.Date, &pt.NewMembers, &pt.Reactivated); err != nil {
			return nil, err
		}
		pt.Label = pt.Date.Format("2006-01-02")
		out = append(out, pt)
	}
	return out, rows.Err()
}

func (r *TenantAnalyticsRepository) TierDistribution(ctx context.Context, in ports.AnalyticsDateRange) ([]ports.TierDistributionSlice, error) {
	db := pickDB(ctx, r.Pool)
	args := []any{in.TenantID}
	locEnr := r.enrollmentLocationClause(in.LocationID, &args)
	q := `
SELECT COALESCE(lt.code, le.tier, 'bronze') AS tier_code,
       COALESCE(lt.code, le.tier, 'bronze') AS tier_name,
       count(*)::bigint,
       COALESCE(lt.color, '#B07A4A')
FROM loyalty_enrollments le
LEFT JOIN loyalty_tiers lt ON lt.id = le.tier_id
WHERE le.tenant_id=$1` + locEnr + `
GROUP BY 1, 2, 4
ORDER BY count(*) DESC`
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.TierDistributionSlice
	var total int64
	for rows.Next() {
		var s ports.TierDistributionSlice
		if err := rows.Scan(&s.TierCode, &s.TierName, &s.Count, &s.Color); err != nil {
			return nil, err
		}
		total += s.Count
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range out {
		if total > 0 {
			out[i].Percent = float64(out[i].Count) / float64(total) * 100
		}
	}
	return out, nil
}

func (r *TenantAnalyticsRepository) HourlyHeatmap(ctx context.Context, in ports.AnalyticsDateRange) ([]ports.HeatmapCell, error) {
	db := pickDB(ctx, r.Pool)
	args := []any{in.TenantID, in.From, in.To}
	locPE := r.locationClause("pe", in.LocationID, &args)
	q := `
SELECT extract(dow from pe.created_at AT TIME ZONE 'UTC')::int AS dow,
       (extract(hour from pe.created_at AT TIME ZONE 'UTC')::int / 2) AS hour_slot,
       count(*)::int AS intensity
FROM point_events pe
WHERE pe.tenant_id=$1 AND pe.created_at >= $2 AND pe.created_at <= $3` + locPE + `
GROUP BY 1, 2
ORDER BY 1, 2`
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.HeatmapCell
	for rows.Next() {
		var c ports.HeatmapCell
		if err := rows.Scan(&c.Day, &c.HourSlot, &c.Intensity); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *TenantAnalyticsRepository) TopRewards(ctx context.Context, in ports.AnalyticsDateRange, limit int) ([]ports.TopRewardRow, error) {
	if limit <= 0 {
		limit = 10
	}
	db := pickDB(ctx, r.Pool)
	args := []any{in.TenantID, in.From, in.To}
	locPE := r.locationClause("pe", in.LocationID, &args)
	args = append(args, limit)
	q := `
SELECT (pe.payload->>'reward_id')::uuid, COALESCE(pe.payload->>'reward_name', ''), count(*)::bigint
FROM point_events pe
WHERE pe.tenant_id=$1 AND pe.created_at >= $2 AND pe.created_at <= $3
  AND pe.event_type = 'redeem'
  AND pe.payload->>'reward_id' IS NOT NULL` + locPE + `
GROUP BY 1, 2
ORDER BY count(*) DESC
LIMIT $` + fmt.Sprintf("%d", len(args))
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.TopRewardRow
	for rows.Next() {
		var row ports.TopRewardRow
		if err := rows.Scan(&row.RewardID, &row.Name, &row.ClaimCount); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *TenantAnalyticsRepository) RetentionCohorts(ctx context.Context, in ports.AnalyticsDateRange) ([]ports.RetentionCohortRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
WITH cohort AS (
  SELECT le.id, date_trunc('month', le.created_at) AS cohort_month
  FROM loyalty_enrollments le
  WHERE le.tenant_id=$1 AND le.created_at >= $2 AND le.created_at <= $3
),
activity AS (
  SELECT c.id, c.cohort_month,
         date_trunc('month', pe.created_at) AS active_month
  FROM cohort c
  JOIN point_events pe ON pe.enrollment_id = c.id AND pe.delta > 0
)
SELECT extract(month from age(active_month, cohort_month))::int AS month_offset,
       round(100.0 * count(DISTINCT id) / NULLIF((SELECT count(*) FROM cohort), 0), 1) AS retention_pct
FROM activity
GROUP BY 1
ORDER BY 1`
	rows, err := db.Query(ctx, q, in.TenantID, in.From, in.To)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.RetentionCohortRow
	for rows.Next() {
		var row ports.RetentionCohortRow
		if err := rows.Scan(&row.MonthOffset, &row.RetentionPct); err != nil {
			return nil, err
		}
		row.Label = fmt.Sprintf("M+%d", row.MonthOffset)
		out = append(out, row)
	}
	return out, rows.Err()
}
