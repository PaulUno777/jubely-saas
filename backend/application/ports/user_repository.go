package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type UserRepository interface {
	Create(ctx context.Context, u *domain.User) error
	CountSuperadmins(ctx context.Context) (int64, error)
	FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustChangePassword bool) error
	CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error)
	ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error)
}
