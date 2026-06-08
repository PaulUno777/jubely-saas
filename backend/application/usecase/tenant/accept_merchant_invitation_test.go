package tenant

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/testutil"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type memInviteRepo struct {
	inv *domain.MerchantInvitation
}

func (m *memInviteRepo) Create(ctx context.Context, inv *domain.MerchantInvitation) error {
	cp := *inv
	m.inv = &cp
	return nil
}

func (m *memInviteRepo) FindByTokenHash(ctx context.Context, tokenHash []byte) (*domain.MerchantInvitation, error) {
	if m.inv == nil {
		return nil, domain.ErrNotFound
	}
	return m.inv, nil
}

func (m *memInviteRepo) MarkAccepted(ctx context.Context, invitationID uuid.UUID, at time.Time) error {
	if m.inv == nil || m.inv.ID != invitationID {
		return domain.ErrConflict
	}
	m.inv.AcceptedAt = &at
	return nil
}

func TestAcceptMerchantInvitation_expired(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	now := time.Date(2026, 4, 29, 12, 0, 0, 0, time.UTC)
	invRepo := &memInviteRepo{inv: &domain.MerchantInvitation{
		ID:         uuid.New(),
		TenantID:   tid,
		Email:      "a@b.com",
		Role:       domain.RoleMerchantAdmin,
		TokenHash:  []byte{1},
		ExpiresAt:  now.Add(-time.Hour),
		AcceptedAt: nil,
		CreatedAt:  now.Add(-2 * time.Hour),
	}}
	uc := &AcceptMerchantInvitation{
		Tx:          testutil.NoopTx{},
		Users:       &testutil.MemUserRepo{},
		Memberships: &testutil.StubMembershipRepo{},
		Invitations: invRepo,
		Hasher:      testutil.StubHasher{},
		Clock:       testutil.StubClock{T: now},
	}
	_, err := uc.Execute(context.Background(), AcceptMerchantInvitationInput{
		Token:    "x",
		Password: "passwordpassword",
	})
	if !errors.Is(err, domain.ErrInvitationExpired) {
		t.Fatalf("expected ErrInvitationExpired, got %v", err)
	}
}
