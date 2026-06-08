package auth

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/testutil"
	"github.com/PaulUno777/jubely-saas/backend/domain"
)

func TestBootstrapSuperadmin_forbidden_when_secret_mismatch(t *testing.T) {
	t.Parallel()
	uc := &BootstrapSuperadmin{
		Users:  &testutil.MemUserRepo{},
		Hasher: testutil.StubHasher{},
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
		Users:  &testutil.MemUserRepo{Count: 1},
		Hasher: testutil.StubHasher{},
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
