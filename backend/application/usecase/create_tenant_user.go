package usecase

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateTenantUser struct {
	Tenants     ports.TenantRepository
	Users       ports.UserRepository
	Memberships ports.TenantMembershipRepository
	Hasher      ports.PasswordHasher
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
	var err error
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
	user, err := uc.Users.FindByEmail(ctx, email)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	if user == nil {
		user = &domain.User{
			ID:                 uuid.New(),
			Email:              email,
			PasswordHash:       hash,
			Role:               in.Role,
			MustChangePassword: true,
		}
		if err := uc.Users.Create(ctx, user); err != nil {
			if errors.Is(err, domain.ErrConflict) {
				return nil, fmt.Errorf("%w", domain.ErrEmailTaken)
			}
			return nil, err
		}
	} else {
		if _, err := uc.Memberships.FindByUserAndTenant(ctx, user.ID, in.TenantID); err == nil {
			return nil, fmt.Errorf("%w", domain.ErrEmailTaken)
		} else if !errors.Is(err, domain.ErrNotFound) {
			return nil, err
		}
		if err := uc.Users.UpdatePassword(ctx, user.ID, hash, true); err != nil {
			return nil, err
		}
	}
	if err := uc.Memberships.Create(ctx, &domain.TenantMembership{
		ID:        uuid.New(),
		UserID:    user.ID,
		TenantID:  in.TenantID,
		Role:      in.Role,
		Status:    domain.MembershipStatusActive,
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		if errors.Is(err, domain.ErrConflict) {
			return nil, fmt.Errorf("%w", domain.ErrEmailTaken)
		}
		return nil, err
	}
	return &CreateTenantUserOutput{UserID: user.ID, TempPassword: pwd}, nil
}
