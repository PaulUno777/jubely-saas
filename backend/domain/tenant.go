package domain

import (
	"time"

	"github.com/google/uuid"
)

// Tenant is a merchant organization. SelfServe=false means no public self-registration (Option 2 MVP).
// When SelfServe=true (Phase 3+), public customer register can be enabled without schema churn.
type Tenant struct {
	ID        uuid.UUID
	Name      string
	Slug      string
	SelfServe bool
	CreatedAt time.Time
	UpdatedAt time.Time
}
