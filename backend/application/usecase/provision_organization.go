package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

const defaultTrialDays = 30

// ProvisionOrganization creates HQ store + Growth trial subscription for a new org.
type ProvisionOrganization struct {
	Stores        ports.StoreRepository
	Subscriptions ports.SubscriptionRepository
	Clock         ports.Clock
}

func (p *ProvisionOrganization) Execute(ctx context.Context, orgID uuid.UUID, orgName, orgSlug string, planCode string) error {
	now := p.Clock.Now().UTC()
	if planCode == "" {
		planCode = "growth"
	}
	store := &domain.Store{
		ID:             uuid.New(),
		OrganizationID: orgID,
		Slug:           "main",
		Name:           orgName,
		CountryCode:    "CM",
		City:           "",
		AddressLine:    "",
		Status:         domain.StoreStatusOpen,
		IsHQ:           true,
		Timezone:       "Africa/Douala",
		Settings:       json.RawMessage(`{}`),
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := p.Stores.Create(ctx, store); err != nil {
		return err
	}
	trialEnd := now.Add(defaultTrialDays * 24 * time.Hour)
	sub := &domain.Subscription{
		ID:                 uuid.New(),
		OrganizationID:     orgID,
		PlanCode:           planCode,
		Status:             domain.SubscriptionTrialing,
		BillingPeriod:      "monthly",
		TrialEndsAt:        &trialEnd,
		CurrentPeriodStart: &now,
		CurrentPeriodEnd:   &trialEnd,
		PaymentMethodPref:  "momo",
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	return p.Subscriptions.Create(ctx, sub)
}
