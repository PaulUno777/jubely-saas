package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Tenant is a merchant organization. SelfServe=false means no public self-registration (Option 2 MVP).
// When SelfServe=true (Phase 3+), public customer register can be enabled without schema churn.
type Tenant struct {
	ID             uuid.UUID
	Name           string
	Slug           string
	SelfServe      bool
	Active         bool
	Plan           string
	ConflictPolicy string
	Settings       json.RawMessage
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// UserPublic is a tenant user row without credentials (for superadmin / admin listings).
type UserPublic struct {
	ID        uuid.UUID
	Email     string
	Role      Role
	CreatedAt time.Time
}
