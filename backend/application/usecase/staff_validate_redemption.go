package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type StaffValidateRedemption struct {
	QRCodec     ports.QRCodec
	Redemptions ports.RedemptionRepository
	Rewards     ports.RewardRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Customers   ports.CustomerIdentityRepository
	Clock       ports.Clock
}

type StaffValidateRedemptionInput struct {
	TenantID uuid.UUID
	ClaimQR  string
}

type StaffValidateRedemptionOutput struct {
	RedemptionID uuid.UUID
	RewardName   string
	PointsSpent  int
	DisplayCode  string
	CustomerName string
	CustomerID   uuid.UUID
}

func (uc *StaffValidateRedemption) Execute(ctx context.Context, in StaffValidateRedemptionInput) (*StaffValidateRedemptionOutput, error) {
	claimQR := strings.TrimSpace(in.ClaimQR)
	if claimQR == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	rdID, err := uc.QRCodec.ParseClaimQR(ctx, claimQR)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	rd, err := uc.Redemptions.FindByClaimQR(ctx, claimQR)
	if err != nil {
		return nil, err
	}
	if rd.ID != rdID || rd.TenantID != in.TenantID {
		return nil, domain.ErrNotFound
	}
	if rd.Status == domain.RedemptionBurned {
		return nil, domain.ErrConflict
	}
	now := uc.Clock.Now().UTC()
	if rd.Status != domain.RedemptionPending || now.After(rd.ExpiresAt) {
		return nil, domain.ErrConflict
	}
	if err := uc.Redemptions.MarkBurned(ctx, rd.ID); err != nil {
		return nil, err
	}
	rw, err := uc.Rewards.FindByID(ctx, in.TenantID, rd.RewardID)
	if err != nil {
		return nil, err
	}
	enr, err := uc.Enrollments.FindByID(ctx, rd.EnrollmentID)
	if err != nil {
		return nil, err
	}
	ci, err := uc.Customers.FindByID(ctx, enr.CustomerID)
	if err != nil {
		return nil, err
	}
	return &StaffValidateRedemptionOutput{
		RedemptionID: rd.ID,
		RewardName:   rw.Name,
		PointsSpent:  rd.PointsSpent,
		DisplayCode:  rd.DisplayCode,
		CustomerName: ci.Name,
		CustomerID:   ci.ID,
	}, nil
}
