package usecase

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type GetOrgSubscription struct {
	Subscriptions ports.SubscriptionRepository
	Plans         ports.PlanCatalogRepository
}

type GetOrgSubscriptionOutput struct {
	Subscription *domain.Subscription
	Plan         *domain.PlanCatalog
}

func (uc *GetOrgSubscription) Execute(ctx context.Context, orgID uuid.UUID) (*GetOrgSubscriptionOutput, error) {
	sub, err := uc.Subscriptions.FindByOrganization(ctx, orgID)
	if err != nil {
		return nil, err
	}
	plan, err := uc.Plans.FindByCode(ctx, sub.PlanCode)
	if err != nil {
		return nil, err
	}
	return &GetOrgSubscriptionOutput{Subscription: sub, Plan: plan}, nil
}

type CreateMoMoInvoice struct {
	Subscriptions ports.SubscriptionRepository
	Plans         ports.PlanCatalogRepository
	Invoices      ports.SubscriptionInvoiceRepository
	Clock         ports.Clock
}

type CreateMoMoInvoiceOutput struct {
	Invoice      *domain.SubscriptionInvoice
	Instructions string
}

func (uc *CreateMoMoInvoice) Execute(ctx context.Context, orgID uuid.UUID) (*CreateMoMoInvoiceOutput, error) {
	sub, err := uc.Subscriptions.FindByOrganization(ctx, orgID)
	if err != nil {
		return nil, err
	}
	plan, err := uc.Plans.FindByCode(ctx, sub.PlanCode)
	if err != nil {
		return nil, err
	}
	amount := plan.PriceMonthlyFCFA
	if sub.BillingPeriod == "yearly" {
		amount = plan.PriceYearlyFCFA
	}
	ref, err := newPayReference()
	if err != nil {
		return nil, err
	}
	now := uc.Clock.Now().UTC()
	exp := now.Add(48 * time.Hour)
	periodEnd := now.Add(30 * 24 * time.Hour)
	if sub.BillingPeriod == "yearly" {
		periodEnd = now.Add(365 * 24 * time.Hour)
	}
	inv := &domain.SubscriptionInvoice{
		ID:             uuid.New(),
		SubscriptionID: sub.ID,
		TenantID:       orgID,
		AmountFCFA:     amount,
		Currency:       "XAF",
		Provider:       "momo",
		PayReference:   &ref,
		Status:         "pending",
		PeriodStart:    &now,
		PeriodEnd:      &periodEnd,
		ExpiresAt:      &exp,
		CreatedAt:      now,
	}
	if err := uc.Invoices.Create(ctx, inv); err != nil {
		return nil, err
	}
	return &CreateMoMoInvoiceOutput{
		Invoice:      inv,
		Instructions: fmt.Sprintf("Pay %d FCFA via MTN/Orange Money with reference %s before %s", amount, ref, exp.Format(time.RFC3339)),
	}, nil
}

type ConfirmMoMoInvoice struct {
	Invoices      ports.SubscriptionInvoiceRepository
	Subscriptions ports.SubscriptionRepository
	Clock         ports.Clock
}

func (uc *ConfirmMoMoInvoice) Execute(ctx context.Context, payReference string) error {
	ref := strings.TrimSpace(strings.ToUpper(payReference))
	inv, err := uc.Invoices.FindByPayReference(ctx, ref)
	if err != nil {
		return err
	}
	now := uc.Clock.Now().UTC()
	if err := uc.Invoices.MarkPaid(ctx, inv.ID, now); err != nil {
		return err
	}
	sub, err := uc.Subscriptions.FindByOrganization(ctx, inv.TenantID)
	if err != nil {
		return err
	}
	sub.Status = domain.SubscriptionActive
	sub.PaymentMethodPref = "momo"
	sub.TrialEndsAt = nil
	if inv.PeriodEnd != nil {
		sub.CurrentPeriodEnd = inv.PeriodEnd
		sub.CurrentPeriodStart = inv.PeriodStart
	}
	sub.UpdatedAt = now
	return uc.Subscriptions.Update(ctx, sub)
}

func newPayReference() (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var sb strings.Builder
	sb.WriteString("JBE-PAY-")
	for i := 0; i < 6; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		sb.WriteByte(alphabet[n.Int64()])
	}
	return sb.String(), nil
}

// ListPlans returns active catalog entries.
type ListPlans struct {
	Plans ports.PlanCatalogRepository
}

func (uc *ListPlans) Execute(ctx context.Context) ([]domain.PlanCatalog, error) {
	return uc.Plans.ListActive(ctx)
}

// PatchOrgSubscription allows superadmin/merchant plan changes (non-Stripe MVP).
type PatchOrgSubscription struct {
	Subscriptions ports.SubscriptionRepository
	Clock         ports.Clock
}

type PatchOrgSubscriptionInput struct {
	TenantID      uuid.UUID
	PlanCode       *string
	Status         *domain.SubscriptionStatus
	BillingPeriod  *string
}

func (uc *PatchOrgSubscription) Execute(ctx context.Context, in PatchOrgSubscriptionInput) (*domain.Subscription, error) {
	sub, err := uc.Subscriptions.FindByOrganization(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	if in.PlanCode != nil {
		sub.PlanCode = strings.TrimSpace(*in.PlanCode)
	}
	if in.Status != nil {
		sub.Status = *in.Status
	}
	if in.BillingPeriod != nil {
		sub.BillingPeriod = strings.TrimSpace(*in.BillingPeriod)
	}
	sub.UpdatedAt = uc.Clock.Now().UTC()
	if err := uc.Subscriptions.Update(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}

