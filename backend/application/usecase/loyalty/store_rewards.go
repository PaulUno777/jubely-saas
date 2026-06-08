package loyalty

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListStoreRewards struct {
	Rewards ports.RewardRepository
}

func (uc *ListStoreRewards) Execute(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]domain.Reward, error) {
	return uc.Rewards.ListByTenant(ctx, tenantID, activeOnly)
}

type CreateStoreReward struct {
	Rewards      ports.RewardRepository
	RewardStores ports.RewardStoreAvailabilityRepository
	Clock        ports.Clock
}

type CreateStoreRewardInput struct {
	TenantID    uuid.UUID
	Name        string
	Description string
	PointCost   int
	MinTier     string
	Active      bool
	StockLimit  *int
	StoreIDs    []uuid.UUID
}

func (uc *CreateStoreReward) Execute(ctx context.Context, in CreateStoreRewardInput) (*domain.Reward, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" || in.PointCost <= 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	tier := strings.TrimSpace(in.MinTier)
	if tier == "" {
		tier = "bronze"
	}
	now := uc.Clock.Now().UTC()
	rw := &domain.Reward{
		ID:          uuid.New(),
		TenantID:    in.TenantID,
		Name:        name,
		Description: strings.TrimSpace(in.Description),
		PointCost:   in.PointCost,
		MinTier:     tier,
		Active:      in.Active,
		StockLimit:  in.StockLimit,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := uc.Rewards.Create(ctx, rw); err != nil {
		return nil, err
	}
	if uc.RewardStores != nil && len(in.StoreIDs) > 0 {
		if err := uc.RewardStores.SetForReward(ctx, rw.ID, in.StoreIDs); err != nil {
			return nil, err
		}
	}
	return rw, nil
}

type PatchStoreReward struct {
	Rewards      ports.RewardRepository
	RewardStores ports.RewardStoreAvailabilityRepository
	Clock        ports.Clock
}

type PatchStoreRewardInput struct {
	TenantID    uuid.UUID
	RewardID    uuid.UUID
	Name        *string
	Description *string
	PointCost   *int
	MinTier     *string
	Active      *bool
	StockLimit  *int
	StoreIDs    []uuid.UUID
	SetStoreIDs bool
}

func (uc *PatchStoreReward) Execute(ctx context.Context, in PatchStoreRewardInput) (*domain.Reward, error) {
	rw, err := uc.Rewards.FindByID(ctx, in.TenantID, in.RewardID)
	if err != nil {
		return nil, err
	}
	if in.Name != nil {
		rw.Name = strings.TrimSpace(*in.Name)
	}
	if in.Description != nil {
		rw.Description = strings.TrimSpace(*in.Description)
	}
	if in.PointCost != nil {
		rw.PointCost = *in.PointCost
	}
	if in.MinTier != nil {
		rw.MinTier = strings.TrimSpace(*in.MinTier)
	}
	if in.Active != nil {
		rw.Active = *in.Active
	}
	if in.StockLimit != nil {
		rw.StockLimit = in.StockLimit
	}
	rw.UpdatedAt = uc.Clock.Now().UTC()
	if err := uc.Rewards.Update(ctx, rw); err != nil {
		return nil, err
	}
	if in.SetStoreIDs && uc.RewardStores != nil {
		if err := uc.RewardStores.SetForReward(ctx, rw.ID, in.StoreIDs); err != nil {
			return nil, err
		}
	}
	return rw, nil
}
