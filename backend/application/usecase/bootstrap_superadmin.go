package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type BootstrapSuperadmin struct {
	Users   ports.UserRepository
	Hasher  ports.PasswordHasher
	Secret  string
}

type BootstrapSuperadminInput struct {
	HeaderSecret string
	Email        string
	Password     string
}

func (uc *BootstrapSuperadmin) Execute(ctx context.Context, in BootstrapSuperadminInput) error {
	if uc.Secret == "" || in.HeaderSecret != uc.Secret {
		return fmt.Errorf("%w", domain.ErrForbidden)
	}
	n, err := uc.Users.CountSuperadmins(ctx)
	if err != nil {
		return err
	}
	if n > 0 {
		return fmt.Errorf("%w", domain.ErrConflict)
	}
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || len(in.Password) < 8 {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	hash, err := uc.Hasher.Hash(in.Password)
	if err != nil {
		return err
	}
	u := &domain.User{
		ID:           uuid.New(),
		TenantID:     nil,
		Email:        email,
		PasswordHash: hash,
		Role:         domain.RoleSuperadmin,
	}
	return uc.Users.Create(ctx, u)
}
