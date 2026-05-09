package usecase

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
)

type ListTenants struct {
	Tenants ports.TenantRepository
}

type ListTenantsInput struct {
	Offset int
	Limit  int
}

type ListTenantsOutput struct {
	Tenants []domain.Tenant
	Total   int64
	Offset  int
	Limit   int
}

func clampTenantPage(offset, limit int) (int, int) {
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return offset, limit
}

func (uc *ListTenants) Execute(ctx context.Context, in ListTenantsInput) (*ListTenantsOutput, error) {
	offset, limit := clampTenantPage(in.Offset, in.Limit)
	total, err := uc.Tenants.CountAll(ctx)
	if err != nil {
		return nil, err
	}
	items, err := uc.Tenants.ListAll(ctx, offset, limit)
	if err != nil {
		return nil, err
	}
	return &ListTenantsOutput{Tenants: items, Total: total, Offset: offset, Limit: limit}, nil
}
