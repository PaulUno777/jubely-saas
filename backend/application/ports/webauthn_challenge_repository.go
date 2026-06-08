package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type WebAuthnChallenge struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Kind        string
	SessionData []byte
	ExpiresAt   time.Time
	CreatedAt   time.Time
}

type WebAuthnChallengeRepository interface {
	Create(ctx context.Context, c WebAuthnChallenge) error
	Find(ctx context.Context, id uuid.UUID) (*WebAuthnChallenge, error)
	Delete(ctx context.Context, id uuid.UUID) error
}
