package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
)

type CustomerIdentityRepository interface {
	Create(ctx context.Context, c *domain.CustomerIdentity) error
	FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error)
}
