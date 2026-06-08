package domain

import (
	"time"

	"github.com/google/uuid"
)

// CustomerIdentity is a global identity across all stores (tenants).
// A customer can have multiple loyalty relationships via LoyaltyEnrollment.
type CustomerIdentity struct {
	ID                uuid.UUID
	UserID            *uuid.UUID
	PhoneE164         string
	Name              string
	Email             *string
	Gender            *string
	DateOfBirth       *time.Time
	Neighborhood      *string
	JobTitle          *string
	PreferredLocale   string
	Interests         []string
	ProfileCompletedAt *time.Time
	NotificationPrefs []byte
	CreatedAt         time.Time
}
