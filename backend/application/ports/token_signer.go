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
	// MFAEnrolledCount is the number of enabled MFA factors for the user (embedded in access JWT for BFF /me).
	MFAEnrolledCount int
	// Permissions are optional in JWT; when nil/empty, middleware uses DefaultPermissionsForRole(Role).
	Permissions []string
}

type TokenSigner interface {
	SignAccessToken(ctx context.Context, claims TokenClaims) (token string, err error)
	ParseAccessToken(ctx context.Context, token string) (TokenClaims, error)
}
