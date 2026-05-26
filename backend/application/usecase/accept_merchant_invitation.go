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
	Memberships ports.TenantMembershipRepository
	Customers   ports.CustomerIdentityRepository
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

		hash, err := uc.Hasher.Hash(in.Password)
		if err != nil {
			return err
		}
		user, err := uc.Users.FindByEmail(ctx, inv.Email)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if user == nil {
			user = &domain.User{
				ID:           uuid.New(),
				Email:        inv.Email,
				PasswordHash: hash,
				Role:         inv.Role,
			}
			if err := uc.Users.Create(ctx, user); err != nil {
				return err
			}
		} else {
			if err := uc.Users.UpdatePassword(ctx, user.ID, hash, false); err != nil {
				return err
			}
		}
		if _, err := uc.Memberships.FindByUserAndTenant(ctx, user.ID, inv.TenantID); err == nil {
			return fmt.Errorf("%w", domain.ErrEmailTaken)
		} else if !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if err := uc.Memberships.Create(ctx, &domain.TenantMembership{
			ID:        uuid.New(),
			UserID:    user.ID,
			TenantID:  inv.TenantID,
			Role:      inv.Role,
			Status:    domain.MembershipStatusActive,
			CreatedAt: now,
		}); err != nil {
			return err
		}
		if uc.Customers != nil {
			if customer, err := uc.Customers.FindByEmail(ctx, inv.Email); err == nil && customer.UserID == nil {
				if err := uc.Customers.AssignUser(ctx, customer.ID, user.ID); err != nil && !errors.Is(err, domain.ErrConflict) {
					return err
				}
			} else if err != nil && !errors.Is(err, domain.ErrNotFound) {
				return err
			}
		}
		if err := uc.Invitations.MarkAccepted(ctx, inv.ID, now); err != nil {
			return err
		}
		out.UserID = user.ID
		out.TenantID = inv.TenantID
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}
