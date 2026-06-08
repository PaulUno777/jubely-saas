package ports

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type InvitationRepository interface {
	Create(ctx context.Context, inv *domain.MerchantInvitation) error
	FindByTokenHash(ctx context.Context, tokenHash []byte) (*domain.MerchantInvitation, error)
	MarkAccepted(ctx context.Context, invitationID uuid.UUID, at time.Time) error
}
