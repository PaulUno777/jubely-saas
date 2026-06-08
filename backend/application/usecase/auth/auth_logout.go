package auth

import (
	"context"
	"crypto/sha256"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
)

type Logout struct {
	RefreshTokens ports.RefreshTokenRepository
	Clock         ports.Clock
}

type LogoutInput struct {
	RefreshToken string
}

func (uc *Logout) Execute(ctx context.Context, in LogoutInput) error {
	if in.RefreshToken == "" {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	sum := sha256.Sum256([]byte(in.RefreshToken))
	return uc.RefreshTokens.RevokeByHash(ctx, sum[:], uc.Clock.Now())
}
