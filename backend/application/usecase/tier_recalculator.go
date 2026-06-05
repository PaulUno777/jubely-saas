package usecase

import (
	"context"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type RecalculateEnrollmentTier struct {
	Tiers       ports.LoyaltyTierRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Balances    ports.EnrollmentBalanceReader
}

func (uc *RecalculateEnrollmentTier) Execute(ctx context.Context, tenantID, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	enr, err := uc.Enrollments.FindByID(ctx, enrollmentID)
	if err != nil {
		return nil, err
	}
	if enr.TenantID != tenantID {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	tiers, err := uc.Tiers.ListByTenant(ctx, tenantID, true)
	if err != nil {
		return nil, err
	}
	var balance int64
	if uc.Balances != nil {
		balance, err = uc.Balances.EnrollmentPointsBalance(ctx, enrollmentID)
		if err != nil {
			return nil, err
		}
	}
	best := pickTierForPoints(tiers, int(balance))
	if best == nil {
		return enr, nil
	}
	if enr.TierID != nil && *enr.TierID == best.ID && enr.Tier == best.Code {
		return enr, nil
	}
	enr.Tier = best.Code
	id := best.ID
	enr.TierID = &id
	if err := uc.Enrollments.Update(ctx, enr); err != nil {
		return nil, err
	}
	return enr, nil
}

func pickTierForPoints(tiers []domain.LoyaltyTier, points int) *domain.LoyaltyTier {
	var best *domain.LoyaltyTier
	for i := range tiers {
		t := &tiers[i]
		if !t.Active || !t.AutoUpgrade {
			continue
		}
		if points < t.MinPoints {
			continue
		}
		if best == nil || t.MinPoints > best.MinPoints || (t.MinPoints == best.MinPoints && t.SortOrder > best.SortOrder) {
			best = t
		}
	}
	return best
}
