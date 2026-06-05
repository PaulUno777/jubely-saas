package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type TenantMembershipRepository interface {
	Create(ctx context.Context, m *domain.TenantMembership) error
	FindByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) (*domain.TenantMembership, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.TenantMembership, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.TenantMembership, error)
	ListWorkspaceSummariesByUser(ctx context.Context, userID uuid.UUID) ([]domain.WorkspaceSummary, error)
	CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error)
	ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error)
}
