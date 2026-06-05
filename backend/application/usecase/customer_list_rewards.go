package usecase

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListCustomerRewards struct {
	Rewards      ports.RewardRepository
	RewardStores ports.RewardStoreAvailabilityRepository
	Enrollments  ports.LoyaltyEnrollmentRepository
	Balances     ports.EnrollmentBalanceReader
}

type CustomerRewardItem struct {
	Reward             domain.Reward
	Affordable         bool
	PointsNeeded       int
	FulfillmentStores  []domain.FulfillmentStore
}

func (uc *ListCustomerRewards) Execute(ctx context.Context, enrollmentID uuid.UUID, tenantID *uuid.UUID) ([]CustomerRewardItem, int64, string, error) {
	enr, err := uc.Enrollments.FindByID(ctx, enrollmentID)
	if err != nil {
		return nil, 0, "", err
	}
	tid := enr.TenantID
	if tenantID != nil && *tenantID != tid {
		return nil, 0, "", domain.ErrNotFound
	}
	balance, err := uc.Balances.EnrollmentPointsBalance(ctx, enr.ID)
	if err != nil {
		return nil, 0, "", err
	}
	rewards, err := uc.Rewards.ListByTenant(ctx, tid, true)
	if err != nil {
		return nil, 0, "", err
	}
	out := make([]CustomerRewardItem, 0, len(rewards))
	for _, rw := range rewards {
		if !tierMeetsMin(enr.Tier, rw.MinTier) {
			continue
		}
		affordable := balance >= int64(rw.PointCost)
		var fs []domain.FulfillmentStore
		if uc.RewardStores != nil {
			fs, _ = uc.RewardStores.ListFulfillmentStoresForReward(ctx, rw.ID)
		}
		out = append(out, CustomerRewardItem{
			Reward:            rw,
			Affordable:        affordable,
			PointsNeeded:      rw.PointCost,
			FulfillmentStores: fs,
		})
	}
	return out, balance, enr.Tier, nil
}

func tierMeetsMin(current, min string) bool {
	order := map[string]int{
		"bronze": 0, "silver": 1, "gold": 2, "platinum": 3, "platine": 3,
	}
	c, okC := order[current]
	m, okM := order[min]
	if !okC || !okM {
		return true
	}
	return c >= m
}
