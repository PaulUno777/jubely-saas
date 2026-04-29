package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type Login struct {
	Tenants ports.TenantRepository
	Users   ports.UserRepository
	Hasher  ports.PasswordHasher
	Signer  ports.TokenSigner
}

type LoginInput struct {
	Email      string
	Password   string
	TenantSlug string // empty => superadmin login
}

type LoginOutput struct {
	AccessToken string
	UserID      uuid.UUID
	TenantID    *uuid.UUID
	Role        domain.Role
	Email       string
}

func (uc *Login) Execute(ctx context.Context, in LoginInput) (*LoginOutput, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || in.Password == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	var user *domain.User
	var err error
	if strings.TrimSpace(in.TenantSlug) == "" {
		user, err = uc.Users.FindSuperadminByEmail(ctx, email)
	} else {
		t, terr := uc.Tenants.FindBySlug(ctx, strings.TrimSpace(strings.ToLower(in.TenantSlug)))
		if terr != nil {
			return nil, terr
		}
		user, err = uc.Users.FindByTenantAndEmail(ctx, t.ID, email)
	}
	if err != nil {
		return nil, err
	}
	if err := uc.Hasher.Compare(user.PasswordHash, in.Password); err != nil {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}

	tok, err := uc.Signer.SignAccessToken(ctx, ports.TokenClaims{
		UserID:   user.ID,
		TenantID: user.TenantID,
		Role:     user.Role,
		Email:    user.Email,
	})
	if err != nil {
		return nil, err
	}
	return &LoginOutput{
		AccessToken: tok,
		UserID:      user.ID,
		TenantID:    user.TenantID,
		Role:        user.Role,
		Email:       user.Email,
	}, nil
}
