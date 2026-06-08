package tenant

import (
	"context"
	"crypto/sha256"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
)

type PreviewInvitation struct {
	Invitations ports.InvitationRepository
	Tenants     ports.TenantRepository
}

type PreviewInvitationInput struct {
	Token string
}

type PreviewInvitationOutput struct {
	Valid       bool
	Code        string
	TenantName  string
	TenantSlug  string
	EmailMasked string
	ExpiresAt   time.Time
	Role        string
}

func (uc *PreviewInvitation) Execute(ctx context.Context, in PreviewInvitationInput) (*PreviewInvitationOutput, error) {
	token := strings.TrimSpace(in.Token)
	if token == "" {
		return nil, domain.ErrInvalid
	}
	sum := sha256.Sum256([]byte(token))
	inv, err := uc.Invitations.FindByTokenHash(ctx, sum[:])
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if inv.AcceptedAt != nil {
		return &PreviewInvitationOutput{Valid: false, Code: i18n.CodeInvitationAlreadyAccepted}, nil
	}
	if !now.Before(inv.ExpiresAt) {
		return &PreviewInvitationOutput{Valid: false, Code: i18n.CodeInvitationExpired}, nil
	}
	t, err := uc.Tenants.FindByID(ctx, inv.TenantID)
	if err != nil {
		return nil, err
	}
	return &PreviewInvitationOutput{
		Valid:       true,
		TenantName:  t.Name,
		TenantSlug:  t.Slug,
		EmailMasked: maskInvitationEmail(inv.Email),
		ExpiresAt:   inv.ExpiresAt,
		Role:        inv.Role.String(),
	}, nil
}

func maskInvitationEmail(email string) string {
	email = strings.TrimSpace(strings.ToLower(email))
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	name := parts[0]
	domainPart := parts[1]
	if name == "" {
		return "***@" + domainPart
	}
	if len(name) == 1 {
		return "*" + "***@" + domainPart
	}
	return string(name[0]) + "***@" + domainPart
}
