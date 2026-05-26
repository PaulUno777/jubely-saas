package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type LoyaltyEnrollmentRepository interface {
	Create(ctx context.Context, e *domain.LoyaltyEnrollment) error
	FindByTenantAndCustomer(ctx context.Context, tenantID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error)
	FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error)
	ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error)
}
