package loyalty

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type GetTenantCustomer struct {
	Enrollments ports.LoyaltyEnrollmentRepository
	Customers   ports.CustomerIdentityRepository
	Balances    ports.EnrollmentBalanceReader
	Tiers       ports.LoyaltyTierRepository
}

type GetTenantCustomerInput struct {
	TenantID     uuid.UUID
	EnrollmentID uuid.UUID
}

type TenantCustomerDetail struct {
	Enrollment    domain.LoyaltyEnrollment
	Customer      domain.CustomerIdentity
	PointsBalance int64
	Tier          *domain.LoyaltyTier
}

func (uc *GetTenantCustomer) Execute(ctx context.Context, in GetTenantCustomerInput) (*TenantCustomerDetail, error) {
	enr, err := uc.Enrollments.FindByID(ctx, in.EnrollmentID)
	if err != nil {
		return nil, err
	}
	if enr.TenantID != in.TenantID {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	ci, err := uc.Customers.FindByID(ctx, enr.CustomerID)
	if err != nil {
		return nil, err
	}
	var balance int64
	if uc.Balances != nil {
		balance, err = uc.Balances.EnrollmentPointsBalance(ctx, enr.ID)
		if err != nil {
			return nil, err
		}
	}
	var tier *domain.LoyaltyTier
	if uc.Tiers != nil && enr.TierID != nil {
		tier, _ = uc.Tiers.FindByID(ctx, in.TenantID, *enr.TierID)
	}
	return &TenantCustomerDetail{
		Enrollment:    *enr,
		Customer:      *ci,
		PointsBalance: balance,
		Tier:          tier,
	}, nil
}

type AdjustCustomerPoints struct {
	Enrollments ports.LoyaltyEnrollmentRepository
	Points      ports.PointEventWriter
	Balances    ports.EnrollmentBalanceReader
	Recalc      *RecalculateEnrollmentTier
}

type AdjustCustomerPointsInput struct {
	TenantID     uuid.UUID
	EnrollmentID uuid.UUID
	ActorUserID  *uuid.UUID
	Delta        int
	Reason       string
}

type AdjustCustomerPointsOutput struct {
	EnrollmentID  uuid.UUID
	Delta         int
	BalanceBefore int64
	BalanceAfter  int64
	Enrollment    *domain.LoyaltyEnrollment
}

func (uc *AdjustCustomerPoints) Execute(ctx context.Context, in AdjustCustomerPointsInput) (*AdjustCustomerPointsOutput, error) {
	if in.Delta == 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	enr, err := uc.Enrollments.FindByID(ctx, in.EnrollmentID)
	if err != nil {
		return nil, err
	}
	if enr.TenantID != in.TenantID {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	var balanceBefore int64
	if uc.Balances != nil {
		balanceBefore, err = uc.Balances.EnrollmentPointsBalance(ctx, enr.ID)
		if err != nil {
			return nil, err
		}
	}
	payload, _ := json.Marshal(map[string]any{
		"reason":        in.Reason,
		"actor_user_id": in.ActorUserID,
		"adjustment":    true,
	})
	eventType := "adjust"
	if err := uc.Points.Append(ctx, in.TenantID, nil, &enr.ID, eventType, in.Delta, payload); err != nil {
		return nil, err
	}
	balanceAfter := balanceBefore + int64(in.Delta)
	var updated *domain.LoyaltyEnrollment
	if uc.Recalc != nil {
		updated, err = uc.Recalc.Execute(ctx, in.TenantID, enr.ID)
		if err != nil {
			return nil, err
		}
	}
	return &AdjustCustomerPointsOutput{
		EnrollmentID:  enr.ID,
		Delta:         in.Delta,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceAfter,
		Enrollment:    updated,
	}, nil
}
