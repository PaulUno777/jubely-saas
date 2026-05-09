package domain

import (
	"time"

	"github.com/google/uuid"
)

type EnrollmentStatus string

const (
	EnrollmentStatusActive   EnrollmentStatus = "active"
	EnrollmentStatusInactive EnrollmentStatus = "inactive"
)

// Enrollment links a customer to a tenant's program (one active enrollment at a time in Phase 1).
type Enrollment struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	CustomerID uuid.UUID
	Status     EnrollmentStatus
	EnrolledAt time.Time
	LeftAt     *time.Time
}

func (s EnrollmentStatus) String() string { return string(s) }
