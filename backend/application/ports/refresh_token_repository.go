package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type RefreshToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash []byte
	ExpiresAt time.Time
	RevokedAt *time.Time
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, in RefreshTokenCreateInput) error
	FindActiveByHash(ctx context.Context, tokenHash []byte) (*RefreshToken, error)
	RevokeByHash(ctx context.Context, tokenHash []byte, revokedAt time.Time) error
}

type RefreshTokenCreateInput struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash []byte
	UserAgent string
	IP        *string
	ExpiresAt time.Time
}
