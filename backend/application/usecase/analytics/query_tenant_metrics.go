package analytics

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
)

type QueryTenantMetrics struct {
	Metrics ports.TenantLoyaltyMetrics
}

func (uc *QueryTenantMetrics) TenantMetrics(ctx context.Context, in ports.TenantMetricsInput) (ports.TenantMetricsResult, error) {
	return uc.Metrics.TenantMetrics(ctx, in)
}

func (uc *QueryTenantMetrics) LoyaltyActivity(ctx context.Context, in ports.TenantMetricsInput) (ports.TenantLoyaltyActivityResult, error) {
	return uc.Metrics.TenantLoyaltyActivity(ctx, in)
}

func (uc *QueryTenantMetrics) NavStats(ctx context.Context, tenantID uuid.UUID) (ports.TenantNavStats, error) {
	return uc.Metrics.TenantNavStats(ctx, tenantID)
}

func (uc *QueryTenantMetrics) Summary(ctx context.Context, tenantID uuid.UUID) (ports.TenantDashboardMetrics, error) {
	return uc.Metrics.TenantSummary(ctx, tenantID)
}
