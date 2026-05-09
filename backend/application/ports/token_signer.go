package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type TokenClaims struct {
	UserID             uuid.UUID
	TenantID           *uuid.UUID
	Role               domain.Role
	Email              string
	MustChangePassword bool
}

type TokenSigner interface {
	SignAccessToken(ctx context.Context, claims TokenClaims) (token string, err error)
	ParseAccessToken(ctx context.Context, token string) (TokenClaims, error)
}
