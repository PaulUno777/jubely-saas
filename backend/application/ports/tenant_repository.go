package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type TenantRepository interface {
	Create(ctx context.Context, t *domain.Tenant) error
	FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error)
	Update(ctx context.Context, t *domain.Tenant) error
	ListAll(ctx context.Context, offset, limit int) ([]domain.Tenant, error)
	CountAll(ctx context.Context) (int64, error)
	CountActive(ctx context.Context) (int64, error)
	// CountActiveByPlan counts tenants that are active and on the given plan (e.g. starter = trial tier in Phase 1 UI).
	CountActiveByPlan(ctx context.Context, plan string) (int64, error)
}
