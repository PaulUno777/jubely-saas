package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type StoreRepository interface {
	Create(ctx context.Context, s *domain.Store) error
	Update(ctx context.Context, s *domain.Store) error
	FindByID(ctx context.Context, organizationID, storeID uuid.UUID) (*domain.Store, error)
	FindHQ(ctx context.Context, organizationID uuid.UUID) (*domain.Store, error)
	ListByOrganization(ctx context.Context, organizationID uuid.UUID) ([]domain.Store, error)
	CountByOrganization(ctx context.Context, organizationID uuid.UUID) (int, error)
}

type StoreMembershipRepository interface {
	Add(ctx context.Context, userID, storeID uuid.UUID) error
	ListStoreIDsForUserInOrg(ctx context.Context, userID, organizationID uuid.UUID) ([]uuid.UUID, error)
	CountDistinctAgentsInOrg(ctx context.Context, organizationID uuid.UUID) (int, error)
}

type RewardStoreAvailabilityRepository interface {
	SetForReward(ctx context.Context, rewardID uuid.UUID, storeIDs []uuid.UUID) error
	ListStoreIDsForReward(ctx context.Context, rewardID uuid.UUID) ([]uuid.UUID, error)
	ListFulfillmentStoresForReward(ctx context.Context, rewardID uuid.UUID) ([]domain.FulfillmentStore, error)
}
