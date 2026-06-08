package tenant

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateMerchantInvitation struct {
	Tenants     ports.TenantRepository
	Invitations ports.InvitationRepository
	Clock       ports.Clock
	TokenTTL    time.Duration
	DefaultRole domain.Role
}

type CreateMerchantInvitationInput struct {
	TenantID uuid.UUID
	Email    string
	Role     domain.Role // optional; defaults to merchant_admin
}

type CreateMerchantInvitationOutput struct {
	InvitationID uuid.UUID
	Token        string
	ExpiresAt    time.Time
}

func (uc *CreateMerchantInvitation) Execute(ctx context.Context, in CreateMerchantInvitationInput) (*CreateMerchantInvitationOutput, error) {
	if _, err := uc.Tenants.FindByID(ctx, in.TenantID); err != nil {
		return nil, err
	}
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	role := in.Role
	if role == "" {
		role = uc.DefaultRole
	}
	if role != domain.RoleMerchantAdmin && role != domain.RoleStaff {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return nil, err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	sum := sha256.Sum256([]byte(token))
	now := uc.Clock.Now()
	exp := now.Add(uc.TokenTTL)
	if uc.TokenTTL <= 0 {
		exp = now.Add(7 * 24 * time.Hour)
	}

	inv := &domain.MerchantInvitation{
		ID:         uuid.New(),
		TenantID:   in.TenantID,
		Email:      email,
		Role:       role,
		TokenHash:  sum[:],
		ExpiresAt:  exp,
		AcceptedAt: nil,
		CreatedAt:  now,
	}
	if err := uc.Invitations.Create(ctx, inv); err != nil {
		return nil, err
	}
	return &CreateMerchantInvitationOutput{
		InvitationID: inv.ID,
		Token:        token,
		ExpiresAt:    exp,
	}, nil
}
