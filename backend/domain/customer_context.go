package domain

import "github.com/google/uuid"

// CustomerEnrollmentSummary is the lightweight customer-program view used in sessions.
type CustomerEnrollmentSummary struct {
	EnrollmentID uuid.UUID
	TenantID     uuid.UUID
	TenantName   string
	TenantSlug   string
	Tier         string
	PointsBalance int64
}
