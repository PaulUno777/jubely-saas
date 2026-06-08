package domain

import (
	"time"

	"github.com/google/uuid"
)

// MerchantInvitation lets a superadmin onboard a merchant admin without public tenant signup.
type MerchantInvitation struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	Email      string
	Role       Role
	TokenHash  []byte
	ExpiresAt  time.Time
	AcceptedAt *time.Time
	CreatedAt  time.Time
}
