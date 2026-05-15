package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// StaffRecordPurchase awards points from a purchase amount using the MVP rule:
// 1 point per 500 FCFA (integer division of amount_fcfa by 500).
type StaffRecordPurchase struct {
	Tenants     ports.TenantRepository
	Customers   ports.CustomerIdentityRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Points      ports.PointEventWriter
}

type StaffRecordPurchaseInput struct {
	TenantID   uuid.UUID
	PhoneE164  string
	AmountFcfa int64
}

type StaffRecordPurchaseOutput struct {
	PointsAwarded int
	Delta         int
	EnrollmentID  uuid.UUID
}

func (uc *StaffRecordPurchase) Execute(ctx context.Context, in StaffRecordPurchaseInput) (*StaffRecordPurchaseOutput, error) {
	phone := strings.TrimSpace(in.PhoneE164)
	if phone == "" || in.AmountFcfa <= 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	delta := int(in.AmountFcfa / 500)
	if delta <= 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	ci, err := uc.Customers.FindByPhoneE164(ctx, phone)
	if err != nil {
		return nil, err
	}
	enr, err := uc.Enrollments.FindByTenantAndCustomer(ctx, in.TenantID, ci.ID)
	if err != nil {
		return nil, err
	}

	payload, _ := json.Marshal(map[string]any{
		"amount_fcfa": in.AmountFcfa,
		"rule":        "mvp_1pt_per_500_fcfa",
	})
	if err := uc.Points.Append(ctx, in.TenantID, &enr.ID, "purchase_award", delta, payload); err != nil {
		return nil, err
	}
	return &StaffRecordPurchaseOutput{
		PointsAwarded: delta,
		Delta:         delta,
		EnrollmentID:  enr.ID,
	}, nil
}
