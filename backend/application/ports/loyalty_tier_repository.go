package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type LoyaltyTierRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]domain.LoyaltyTier, error)
	FindByID(ctx context.Context, tenantID, tierID uuid.UUID) (*domain.LoyaltyTier, error)
	FindByCode(ctx context.Context, tenantID uuid.UUID, code string) (*domain.LoyaltyTier, error)
	Create(ctx context.Context, tier *domain.LoyaltyTier) error
	Update(ctx context.Context, tier *domain.LoyaltyTier) error
}
