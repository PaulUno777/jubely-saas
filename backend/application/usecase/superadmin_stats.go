package usecase

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
)

type SuperadminStats struct {
	Tenants ports.TenantRepository
}

type SuperadminStatsOutput struct {
	TenantsTotal       int64
	TenantsActive      int64
	TenantsTrialActive int64
	Alerts             int64
}

func (uc *SuperadminStats) Execute(ctx context.Context) (*SuperadminStatsOutput, error) {
	total, err := uc.Tenants.CountAll(ctx)
	if err != nil {
		return nil, err
	}
	active, err := uc.Tenants.CountActive(ctx)
	if err != nil {
		return nil, err
	}
	trial, err := uc.Tenants.CountActiveByPlan(ctx, "starter")
	if err != nil {
		return nil, err
	}
	return &SuperadminStatsOutput{
		TenantsTotal:       total,
		TenantsActive:      active,
		TenantsTrialActive: trial,
		Alerts:             0,
	}, nil
}
