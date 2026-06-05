package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type RewardRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]domain.Reward, error)
	FindByID(ctx context.Context, tenantID, rewardID uuid.UUID) (*domain.Reward, error)
	Create(ctx context.Context, r *domain.Reward) error
	Update(ctx context.Context, r *domain.Reward) error
}

type RedemptionRepository interface {
	Create(ctx context.Context, r *domain.Redemption) error
	FindByClaimQR(ctx context.Context, claimQR string) (*domain.Redemption, error)
	MarkBurned(ctx context.Context, id uuid.UUID) error
	CountClaimedByReward(ctx context.Context, rewardID uuid.UUID) (int64, error)
}
