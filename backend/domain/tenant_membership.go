package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type MembershipStatus string

const (
	MembershipStatusActive   MembershipStatus = "active"
	MembershipStatusDisabled MembershipStatus = "disabled"
)

// TenantMembership grants a global user access to a tenant workspace.
type TenantMembership struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	TenantID    uuid.UUID
	Role        Role
	Permissions json.RawMessage
	Status      MembershipStatus
	CreatedAt   time.Time
}

// WorkspaceSummary is the lightweight view embedded in auth/session responses.
type WorkspaceSummary struct {
	MembershipID uuid.UUID
	TenantID     uuid.UUID
	TenantName   string
	TenantSlug   string
	Role         Role
	Permissions  []string
}
