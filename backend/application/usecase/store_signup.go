package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// StoreSignup creates a new tenant and the first store admin user (merchant_admin) in one flow.
// This is the Phase 2 pivot enabling self-serve onboarding.
type StoreSignup struct {
	Tx      ports.TxManager
	Tenants ports.TenantRepository
	Users   ports.UserRepository
	Hasher  ports.PasswordHasher
	Signer  ports.TokenSigner
	Clock   ports.Clock
}

type StoreSignupInput struct {
	TenantName string
	TenantSlug string
	Plan       string

	AdminEmail    string
	AdminPassword string
	// LogoURL optional HTTPS URL (e.g. after upload to R2 or local /v1/public/files/...).
	LogoURL string
}

type StoreSignupOutput struct {
	TenantID    uuid.UUID
	TenantSlug  string
	UserID      uuid.UUID
	AccessToken string
}

func slugifyTenantSlug(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	s = strings.ReplaceAll(s, " ", "-")
	return s
}

func (uc *StoreSignup) Execute(ctx context.Context, in StoreSignupInput) (*StoreSignupOutput, error) {
	name := strings.TrimSpace(in.TenantName)
	slug := slugifyTenantSlug(in.TenantSlug)
	email := strings.TrimSpace(strings.ToLower(in.AdminEmail))
	if name == "" || slug == "" || email == "" || len(in.AdminPassword) < 8 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	plan := strings.TrimSpace(strings.ToLower(in.Plan))
	if plan == "" {
		plan = "starter"
	}
	if !domain.IsValidTenantPlan(plan) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	now := uc.Clock.Now()
	settings := map[string]any{}
	if u := strings.TrimSpace(in.LogoURL); u != "" {
		settings["logo_url"] = u
	}
	settingsJSON := json.RawMessage(`{}`)
	if len(settings) > 0 {
		b, err := json.Marshal(settings)
		if err != nil {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		settingsJSON = b
	}
	t := &domain.Tenant{
		ID:             uuid.New(),
		Name:           name,
		Slug:           slug,
		SelfServe:      true,
		Active:         true,
		Plan:           plan,
		ConflictPolicy: "HIGHEST_WINS",
		Settings:       settingsJSON,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	u := &domain.User{
		ID:       uuid.New(),
		TenantID: &t.ID,
		Email:    email,
		Role:     domain.RoleMerchantAdmin,
	}

	var accessToken string
	err := uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := uc.Tenants.Create(ctx, t); err != nil {
			return err
		}

		// Ensure no existing user exists with same email in tenant (defensive; should be empty for new tenant).
		_, err := uc.Users.FindByTenantAndEmail(ctx, t.ID, email)
		if err == nil {
			return fmt.Errorf("%w", domain.ErrEmailTaken)
		}
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}

		hash, err := uc.Hasher.Hash(in.AdminPassword)
		if err != nil {
			return err
		}
		u.PasswordHash = hash

		if err := uc.Users.Create(ctx, u); err != nil {
			if errors.Is(err, domain.ErrConflict) {
				return fmt.Errorf("%w", domain.ErrEmailTaken)
			}
			return err
		}

		tok, err := uc.Signer.SignAccessToken(ctx, ports.TokenClaims{
			UserID:             u.ID,
			TenantID:           u.TenantID,
			Role:               u.Role,
			Email:              u.Email,
			MustChangePassword: u.MustChangePassword,
			MFAEnrolledCount:   0,
			Permissions:        domain.DefaultPermissionsForRole(u.Role),
		})
		if err != nil {
			return err
		}
		accessToken = tok
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &StoreSignupOutput{
		TenantID:    t.ID,
		TenantSlug:  t.Slug,
		UserID:      u.ID,
		AccessToken: accessToken,
	}, nil
}
