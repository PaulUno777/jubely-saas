package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type noopTx struct{}

func (noopTx) WithinTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return fn(ctx)
}

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

type memUserRepo struct {
	users []*domain.User
}

func (m *memUserRepo) Create(ctx context.Context, u *domain.User) error {
	cp := *u
	m.users = append(m.users, &cp)
	return nil
}

func (m *memUserRepo) CountSuperadmins(ctx context.Context) (int64, error) { return 0, nil }

func (m *memUserRepo) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (m *memUserRepo) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	for _, u := range m.users {
		if u.TenantID != nil && *u.TenantID == tenantID && u.Email == email {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return nil, domain.ErrNotFound
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
		Tx:          noopTx{},
		Users:       &memUserRepo{},
		Invitations: invRepo,
		Hasher:      stubHasher{},
		Clock:       stubClock{t: now},
	}
	_, err := uc.Execute(context.Background(), AcceptMerchantInvitationInput{
		Token:    "x",
		Password: "passwordpassword",
	})
	if !errors.Is(err, domain.ErrInvitationExpired) {
		t.Fatalf("expected ErrInvitationExpired, got %v", err)
	}
}
