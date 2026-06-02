package domain

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionStatus string

const (
	SubscriptionTrialing SubscriptionStatus = "trialing"
	SubscriptionActive   SubscriptionStatus = "active"
	SubscriptionPastDue  SubscriptionStatus = "past_due"
	SubscriptionPaused   SubscriptionStatus = "paused"
	SubscriptionFrozen   SubscriptionStatus = "frozen"
	SubscriptionCanceled SubscriptionStatus = "canceled"
)

func (s SubscriptionStatus) AllowsWrites() bool {
	return s == SubscriptionActive || s == SubscriptionTrialing
}

type PlanCatalog struct {
	Code                string
	Name                string
	MaxStores           int
	MaxAgents           int
	MaxActiveCustomers  int
	PriceMonthlyFCFA    int
	PriceYearlyFCFA     int
	Features            []byte
	Active              bool
}

type Subscription struct {
	ID                     uuid.UUID
	OrganizationID         uuid.UUID
	PlanCode               string
	Status                 SubscriptionStatus
	BillingPeriod          string
	TrialEndsAt            *time.Time
	CurrentPeriodStart     *time.Time
	CurrentPeriodEnd       *time.Time
	CancelAtPeriodEnd      bool
	PausedAt               *time.Time
	PaymentMethodPref      string
	StripeCustomerID       *string
	StripeSubscriptionID   *string
	CreatedAt              time.Time
	UpdatedAt              time.Time
}

type SubscriptionInvoice struct {
	ID             uuid.UUID
	SubscriptionID uuid.UUID
	OrganizationID uuid.UUID
	AmountFCFA     int
	Currency       string
	Provider       string
	PayReference   *string
	Status         string
	PeriodStart    *time.Time
	PeriodEnd      *time.Time
	ExpiresAt      *time.Time
	PaidAt         *time.Time
	CreatedAt      time.Time
}
