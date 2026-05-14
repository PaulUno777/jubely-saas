package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StoreLoyaltyMetrics aggregates loyalty activity from point_events for merchant dashboards.
type StoreLoyaltyMetrics struct {
	Pool *pgxpool.Pool
}

// TenantSummary returns points issued (sum of positive deltas, all time) and point event count in the current UTC month.
func (r *StoreLoyaltyMetrics) TenantSummary(ctx context.Context, tenantID uuid.UUID) (pointsDistributed int64, pointEventsThisMonth int64, err error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT
  COALESCE(SUM(GREATEST(delta, 0)), 0)::bigint,
  COALESCE(COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)), 0)::bigint
FROM point_events
WHERE tenant_id = $1`
	err = db.QueryRow(ctx, q, tenantID).Scan(&pointsDistributed, &pointEventsThisMonth)
	return pointsDistributed, pointEventsThisMonth, err
}
