package ports

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type EnrollmentListFilter struct {
	Status     *string
	TierID     *uuid.UUID
	LocationID *uuid.UUID
	Search     string
	Offset     int
	Limit      int
}

type LoyaltyEnrollmentRepository interface {
	Create(ctx context.Context, e *domain.LoyaltyEnrollment) error
	Update(ctx context.Context, e *domain.LoyaltyEnrollment) error
	FindByTenantAndCustomer(ctx context.Context, tenantID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error)
	FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error)
	ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, filter EnrollmentListFilter) ([]domain.LoyaltyEnrollment, error)
	UpdateInteraction(ctx context.Context, enrollmentID uuid.UUID, at time.Time, locationID *uuid.UUID) error
}
