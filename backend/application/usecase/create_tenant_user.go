package usecase

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateTenantUser struct {
	Tenants ports.TenantRepository
	Users   ports.UserRepository
	Hasher  ports.PasswordHasher
}

type CreateTenantUserInput struct {
	TenantID     uuid.UUID
	Email        string
	Role         domain.Role
	TempPassword *string
}

type CreateTenantUserOutput struct {
	UserID       uuid.UUID
	TempPassword string
}

func genTempPassword() (string, error) {
	b := make([]byte, 18) // ~24 chars after base64url
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (uc *CreateTenantUser) Execute(ctx context.Context, in CreateTenantUserInput) (*CreateTenantUserOutput, error) {
	if in.TenantID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if in.Role != domain.RoleMerchantAdmin {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	// Ensure tenant exists.
	if _, err := uc.Tenants.FindByID(ctx, in.TenantID); err != nil {
		return nil, err
	}
	_, err := uc.Users.FindByTenantAndEmail(ctx, in.TenantID, email)
	if err == nil {
		return nil, fmt.Errorf("%w", domain.ErrEmailTaken)
	}
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	var pwd string
	if in.TempPassword != nil && strings.TrimSpace(*in.TempPassword) != "" {
		pwd = strings.TrimSpace(*in.TempPassword)
	} else {
		pwd, err = genTempPassword()
		if err != nil {
			return nil, err
		}
	}
	if len(pwd) < 8 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	hash, err := uc.Hasher.Hash(pwd)
	if err != nil {
		return nil, err
	}
	u := &domain.User{
		ID:                 uuid.New(),
		TenantID:           &in.TenantID,
		Email:              email,
		PasswordHash:       hash,
		Role:               in.Role,
		MustChangePassword: true,
	}
	if err := uc.Users.Create(ctx, u); err != nil {
		if errors.Is(err, domain.ErrConflict) {
			return nil, fmt.Errorf("%w", domain.ErrEmailTaken)
		}
		return nil, err
	}
	return &CreateTenantUserOutput{UserID: u.ID, TempPassword: pwd}, nil
}
