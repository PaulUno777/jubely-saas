package postgres

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StoreLoyaltyMetrics aggregates loyalty activity from point_events for merchant dashboards.
type StoreLoyaltyMetrics struct {
	Pool *pgxpool.Pool
}

// TenantSummary returns dashboard aggregates for merchant admin KPIs.
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
