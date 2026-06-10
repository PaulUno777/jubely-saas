package staff

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/loyaltyevents"
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// StaffRecordPurchase awards points using the tenant rule engine.
type StaffRecordPurchase struct {
	QRCodec       ports.QRCodec
	Tenants       ports.TenantRepository
	Customers     ports.CustomerIdentityRepository
	Enrollments   ports.LoyaltyEnrollmentRepository
	Points        ports.PointEventWriter
	Balances      ports.EnrollmentBalanceReader
	Rules         ports.PointsRuleRepository
	Ingestions    ports.PurchaseIngestionRepository
	TierRecalc    *loyalty.RecalculateEnrollmentTier
	Events        ports.EventBus
	Clock         ports.Clock
}

type StaffRecordPurchaseInput struct {
	TenantID       uuid.UUID
	StoreID        *uuid.UUID
	PhoneE164      string
	CustomerQR     string
	AmountFcfa     int64
	OccurredAt     *time.Time
	IdempotencyKey string
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
	if uc.Rules == nil || uc.Clock == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	idemKey := strings.TrimSpace(in.IdempotencyKey)
	if idemKey != "" && uc.Ingestions != nil {
		if payload, pts, err := uc.Ingestions.FindByKey(ctx, in.TenantID, idemKey); err == nil {
			var cached struct {
				EnrollmentID uuid.UUID `json:"enrollment_id"`
				CustomerID   uuid.UUID `json:"customer_id"`
				CustomerName string    `json:"customer_name"`
				Tier         string    `json:"tier"`
				BalanceAfter int64     `json:"balance_after"`
			}
			_ = json.Unmarshal(payload, &cached)
			return &StaffRecordPurchaseOutput{
				PointsAwarded: pts,
				Delta:         pts,
				EnrollmentID:  cached.EnrollmentID,
				CustomerID:    cached.CustomerID,
				CustomerName:  cached.CustomerName,
				Tier:          cached.Tier,
				BalanceAfter:  cached.BalanceAfter,
				BalanceBefore: cached.BalanceAfter - int64(pts),
			}, nil
		}
	}

	enr, ci, err := uc.resolveEnrollment(ctx, in)
	if err != nil {
		return nil, err
	}

	occurredAt := uc.Clock.Now().UTC()
	if in.OccurredAt != nil {
		occurredAt = in.OccurredAt.UTC()
	}
	evalOut, err := loyalty.EvaluatePurchasePoints(ctx, uc.Rules, in.TenantID, in.AmountFcfa, enr.Tier, occurredAt)
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

	ruleIDs := parseRuleUUIDs(rules.AppliedRuleIDs(evalOut.Trace))
	payload, _ := json.Marshal(map[string]any{
		"amount_fcfa": in.AmountFcfa,
		"event_type":  "earn",
		"rules_eval":  evalOut,
	})
	if err := uc.Points.AppendAt(ctx, in.TenantID, in.StoreID, &enr.ID, "earn", delta, payload, occurredAt, ruleIDs); err != nil {
		return nil, err
	}

	balanceAfter := balanceBefore + int64(delta)
	tier := enr.Tier
	if uc.TierRecalc != nil {
		if updated, err := uc.TierRecalc.Execute(ctx, in.TenantID, enr.ID); err == nil && updated != nil {
			tier = updated.Tier
		}
	}

	out := &StaffRecordPurchaseOutput{
		PointsAwarded: delta,
		Delta:         delta,
		EnrollmentID:  enr.ID,
		CustomerID:    ci.ID,
		CustomerName:  ci.Name,
		Tier:          tier,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceAfter,
	}

	if idemKey != "" && uc.Ingestions != nil {
		cachePayload, _ := json.Marshal(map[string]any{
			"enrollment_id": enr.ID,
			"customer_id":   ci.ID,
			"customer_name": ci.Name,
			"tier":          tier,
			"balance_after": balanceAfter,
		})
		_ = uc.Ingestions.Insert(ctx, in.TenantID, idemKey, &enr.ID, in.AmountFcfa, delta, cachePayload)
	}

	if uc.Events != nil {
		_ = uc.Events.Publish(ctx,
			loyaltyevents.PurchaseRecorded{
				TenantID:       in.TenantID,
				EnrollmentID:   enr.ID,
				AmountFcfa:     in.AmountFcfa,
				OccurredAt:     occurredAt,
				IdempotencyKey: idemKey,
				Source:         "staff",
			},
			loyaltyevents.PointsAwarded{
				TenantID:     in.TenantID,
				EnrollmentID: enr.ID,
				Delta:        delta,
				RuleIDs:      rules.AppliedRuleIDs(evalOut.Trace),
			},
		)
	}
	return out, nil
}

func parseRuleUUIDs(ids []string) []uuid.UUID {
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if u, err := uuid.Parse(id); err == nil {
			out = append(out, u)
		}
	}
	return out
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
