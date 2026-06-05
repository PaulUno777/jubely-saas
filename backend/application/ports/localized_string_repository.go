package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type LocalizedStringRepository interface {
	ListByOwner(ctx context.Context, ownerType string, ownerID uuid.UUID) ([]domain.LocalizedString, error)
	Upsert(ctx context.Context, s *domain.LocalizedString) error
	Delete(ctx context.Context, ownerType string, ownerID uuid.UUID, fieldKey, locale string) error
}
