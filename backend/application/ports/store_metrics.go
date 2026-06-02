package ports

import (
	"context"

	"github.com/google/uuid"
)

// TenantDashboardMetrics aggregates loyalty KPIs for merchant admin dashboards.
type TenantDashboardMetrics struct {
	PointsDistributed    int64
	PointEventsThisMonth   int64
	ClientsServedToday     int64
	PointsIssuedToday      int64
	RedemptionsToday       int64
	NewEnrollmentsToday    int64
}

// TenantLoyaltyMetrics reads org-level loyalty aggregates for dashboards.
type TenantLoyaltyMetrics interface {
	TenantSummary(ctx context.Context, tenantID uuid.UUID) (TenantDashboardMetrics, error)
}
