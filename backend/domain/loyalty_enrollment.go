package domain

import (
	"time"

	"github.com/google/uuid"
)

// LoyaltyEnrollment is the per-store loyalty relationship.
type LoyaltyEnrollment struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	CustomerID uuid.UUID
	Tier       string
	CreatedAt  time.Time
}
