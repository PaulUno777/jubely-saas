package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CustomerIdentityRepository interface {
	Create(ctx context.Context, c *domain.CustomerIdentity) error
	FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error)
	FindByEmail(ctx context.Context, email string) (*domain.CustomerIdentity, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*domain.CustomerIdentity, error)
	AssignUser(ctx context.Context, customerID, userID uuid.UUID) error
}
