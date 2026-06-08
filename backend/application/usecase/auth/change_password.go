package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ChangePassword struct {
	Users  ports.UserRepository
	Hasher ports.PasswordHasher
}

type ChangePasswordInput struct {
	UserID          uuid.UUID
	CurrentPassword string
	NewPassword     string
}

func (uc *ChangePassword) Execute(ctx context.Context, in ChangePasswordInput) error {
	if in.UserID == uuid.Nil {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	cur := in.CurrentPassword
	next := strings.TrimSpace(in.NewPassword)
	if cur == "" || len(next) < 8 {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	u, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return err
	}
	if err := uc.Hasher.Compare(u.PasswordHash, cur); err != nil {
		return fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	hash, err := uc.Hasher.Hash(next)
	if err != nil {
		return err
	}
	return uc.Users.UpdatePassword(ctx, u.ID, hash, false)
}
