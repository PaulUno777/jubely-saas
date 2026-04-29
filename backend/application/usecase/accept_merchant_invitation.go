package usecase

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type AcceptMerchantInvitation struct {
	Tx          ports.TxManager
	Users       ports.UserRepository
	Invitations ports.InvitationRepository
	Hasher      ports.PasswordHasher
	Clock       ports.Clock
}

type AcceptMerchantInvitationInput struct {
	Token    string
	Password string
}

type AcceptMerchantInvitationOutput struct {
	UserID   uuid.UUID
	TenantID uuid.UUID
}

func (uc *AcceptMerchantInvitation) Execute(ctx context.Context, in AcceptMerchantInvitationInput) (*AcceptMerchantInvitationOutput, error) {
	token := strings.TrimSpace(in.Token)
	if token == "" || len(in.Password) < 8 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	sum := sha256.Sum256([]byte(token))

	var out AcceptMerchantInvitationOutput
	err := uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		inv, err := uc.Invitations.FindByTokenHash(ctx, sum[:])
		if err != nil {
			return err
		}
		now := uc.Clock.Now()
		if inv.AcceptedAt != nil {
			return fmt.Errorf("%w", domain.ErrConflict)
		}
		if !now.Before(inv.ExpiresAt) {
			return fmt.Errorf("%w", domain.ErrInvitationExpired)
		}

		_, err = uc.Users.FindByTenantAndEmail(ctx, inv.TenantID, inv.Email)
		if err == nil {
			return fmt.Errorf("%w", domain.ErrEmailTaken)
		}
		if !errors.Is(err, domain.ErrNotFound) {
			return err
		}

		hash, err := uc.Hasher.Hash(in.Password)
		if err != nil {
			return err
		}
		u := &domain.User{
			ID:           uuid.New(),
			TenantID:     &inv.TenantID,
			Email:        inv.Email,
			PasswordHash: hash,
			Role:         inv.Role,
		}
		if err := uc.Users.Create(ctx, u); err != nil {
			return err
		}
		if err := uc.Invitations.MarkAccepted(ctx, inv.ID, now); err != nil {
			return err
		}
		out.UserID = u.ID
		out.TenantID = inv.TenantID
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}
