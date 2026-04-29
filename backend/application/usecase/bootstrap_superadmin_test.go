package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type stubUserRepo struct {
	count   int64
	created *domain.User
}

func (s *stubUserRepo) Create(ctx context.Context, u *domain.User) error {
	cp := *u
	s.created = &cp
	return nil
}

func (s *stubUserRepo) CountSuperadmins(ctx context.Context) (int64, error) {
	return s.count, nil
}

func (s *stubUserRepo) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (s *stubUserRepo) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (s *stubUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

type stubHasher struct{}

func (stubHasher) Hash(password string) (string, error) { return "h(" + password + ")", nil }
func (stubHasher) Compare(hash, password string) error { return nil }

func TestBootstrapSuperadmin_forbidden_when_secret_mismatch(t *testing.T) {
	t.Parallel()
	uc := &BootstrapSuperadmin{
		Users:  &stubUserRepo{},
		Hasher: stubHasher{},
		Secret: "correct",
	}
	err := uc.Execute(context.Background(), BootstrapSuperadminInput{
		HeaderSecret: "wrong",
		Email:        "a@b.com",
		Password:     "passwordpassword",
	})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestBootstrapSuperadmin_conflict_when_already_bootstrapped(t *testing.T) {
	t.Parallel()
	uc := &BootstrapSuperadmin{
		Users:  &stubUserRepo{count: 1},
		Hasher: stubHasher{},
		Secret: "s",
	}
	err := uc.Execute(context.Background(), BootstrapSuperadminInput{
		HeaderSecret: "s",
		Email:        "a@b.com",
		Password:     "passwordpassword",
	})
	if !errors.Is(err, domain.ErrConflict) {
		t.Fatalf("expected ErrConflict, got %v", err)
	}
}
