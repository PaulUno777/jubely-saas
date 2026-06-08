package tenant

import (
	"context"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type GetTenant struct {
	Tenants ports.TenantRepository
}

type GetTenantInput struct {
	TenantID *uuid.UUID
	Slug     string
}

func (uc *GetTenant) Execute(ctx context.Context, in GetTenantInput) (*domain.Tenant, error) {
	if in.TenantID != nil {
		return uc.Tenants.FindByID(ctx, *in.TenantID)
	}
	slug := strings.TrimSpace(strings.ToLower(in.Slug))
	if slug == "" {
		return nil, domain.ErrInvalid
	}
	return uc.Tenants.FindBySlug(ctx, slug)
}
