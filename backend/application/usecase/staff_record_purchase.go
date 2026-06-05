package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// StaffRecordPurchase awards points using the tenant rule engine (default 1 pt / 100 FCFA).
type StaffRecordPurchase struct {
	QRCodec     ports.QRCodec
	Tenants     ports.TenantRepository
	Customers   ports.CustomerIdentityRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Points      ports.PointEventWriter
	Balances    ports.EnrollmentBalanceReader
	Rules       ports.PointsRuleRepository
	Clock       ports.Clock
}

type StaffRecordPurchaseInput struct {
	TenantID    uuid.UUID
	StoreID     *uuid.UUID
	PhoneE164   string
	CustomerQR  string
	AmountFcfa  int64
	OccurredAt  *time.Time
}

type StaffRecordPurchaseOutput struct {
	PointsAwarded  int
	Delta          int
	EnrollmentID   uuid.UUID
	CustomerID     uuid.UUID
	CustomerName   string
	Tier           string
	BalanceBefore  int64
	BalanceAfter   int64
}

func (uc *StaffRecordPurchase) Execute(ctx context.Context, in StaffRecordPurchaseInput) (*StaffRecordPurchaseOutput, error) {
	if in.AmountFcfa <= 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	enr, ci, err := uc.resolveEnrollment(ctx, in)
	if err != nil {
		return nil, err
	}

	if uc.Rules == nil || uc.Clock == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	occurredAt := uc.Clock.Now().UTC()
	if in.OccurredAt != nil {
		occurredAt = in.OccurredAt.UTC()
	}
	evalOut, err := EvaluatePurchasePoints(ctx, uc.Rules, in.TenantID, in.AmountFcfa, enr.Tier, occurredAt)
	if err != nil {
		return nil, err
	}
	delta := evalOut.Total
	if delta <= 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	var balanceBefore int64
	if uc.Balances != nil {
		balanceBefore, err = uc.Balances.EnrollmentPointsBalance(ctx, enr.ID)
		if err != nil {
			return nil, err
		}
	}

	payload, _ := json.Marshal(map[string]any{
		"amount_fcfa": in.AmountFcfa,
		"event_type":  "earn",
		"rules_eval":  evalOut,
	})
	if err := uc.Points.AppendAt(ctx, in.TenantID, in.StoreID, &enr.ID, "earn", delta, payload, occurredAt); err != nil {
		return nil, err
	}
	return &StaffRecordPurchaseOutput{
		PointsAwarded: delta,
		Delta:         delta,
		EnrollmentID:  enr.ID,
		CustomerID:    ci.ID,
		CustomerName:  ci.Name,
		Tier:          enr.Tier,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceBefore + int64(delta),
	}, nil
}

func (uc *StaffRecordPurchase) resolveEnrollment(ctx context.Context, in StaffRecordPurchaseInput) (*domain.LoyaltyEnrollment, *domain.CustomerIdentity, error) {
	qr := strings.TrimSpace(in.CustomerQR)
	phone := strings.TrimSpace(in.PhoneE164)
	if qr == "" && phone == "" {
		return nil, nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if qr != "" {
		if uc.QRCodec == nil {
			return nil, nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		tenantID, customerID, err := uc.QRCodec.ParseCustomerQR(ctx, qr)
		if err != nil {
			return nil, nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		if tenantID != in.TenantID {
			return nil, nil, domain.ErrNotFound
		}
		ci, err := uc.Customers.FindByID(ctx, customerID)
		if err != nil {
			return nil, nil, err
		}
		enr, err := uc.Enrollments.FindByTenantAndCustomer(ctx, in.TenantID, customerID)
		if err != nil {
			return nil, nil, err
		}
		return enr, ci, nil
	}
	ci, err := uc.Customers.FindByPhoneE164(ctx, phone)
	if err != nil {
		return nil, nil, err
	}
	enr, err := uc.Enrollments.FindByTenantAndCustomer(ctx, in.TenantID, ci.ID)
	if err != nil {
		return nil, nil, err
	}
	return enr, ci, nil
}
