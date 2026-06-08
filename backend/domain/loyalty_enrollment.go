package domain

import (
	"time"

	"github.com/google/uuid"
)

// LoyaltyEnrollment is the per-store loyalty relationship.
type LoyaltyEnrollment struct {
	ID                        uuid.UUID
	TenantID                  uuid.UUID
	CustomerID                uuid.UUID
	Tier                      string
	TierID                    *uuid.UUID
	HomeStoreID               *uuid.UUID
	EnrollmentSource          string
	EnrollmentLocationID      *uuid.UUID
	LastInteractionAt         *time.Time
	LastInteractionLocationID *uuid.UUID
	LifetimeSpendFcfa         int64
	VisitCount                int
	Status                    string
	CreatedAt                 time.Time
}
