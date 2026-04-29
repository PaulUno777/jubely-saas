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
}
