package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type stubClock struct{ t time.Time }

func (s stubClock) Now() time.Time { return s.t }

type stubTenantRepo struct {
	createErr error
	created     *domain.Tenant
}

func (s *stubTenantRepo) Create(ctx context.Context, t *domain.Tenant) error {
	if s.createErr != nil {
		return s.createErr
	}
	cp := *t
	s.created = &cp
	return nil
}

func (s *stubTenantRepo) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	return nil, domain.ErrNotFound
}

func (s *stubTenantRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	return nil, domain.ErrNotFound
}

func TestCreateTenant_sets_self_serve_and_slugifies(t *testing.T) {
	t.Parallel()
	now := time.Date(2026, 4, 29, 0, 0, 0, 0, time.UTC)
	repo := &stubTenantRepo{}
	uc := &CreateTenant{
		Tenants: repo,
		Clock:   stubClock{t: now},
	}

	out, err := uc.Execute(context.Background(), CreateTenantInput{
		Name:      "Chez Mama",
		Slug:      "Chez Mama",
		SelfServe: false,
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if out.Tenant.Slug != "chez-mama" {
		t.Fatalf("slug: got %q", out.Tenant.Slug)
	}
	if out.Tenant.SelfServe != false {
		t.Fatalf("self_serve: got %v", out.Tenant.SelfServe)
	}
	if repo.created == nil || repo.created.Name != "Chez Mama" {
		t.Fatalf("persisted tenant: %+v", repo.created)
	}
}

func TestCreateTenant_invalid_input(t *testing.T) {
	t.Parallel()
	uc := &CreateTenant{
		Tenants: &stubTenantRepo{},
		Clock:   stubClock{t: time.Now()},
	}
	_, err := uc.Execute(context.Background(), CreateTenantInput{Name: "", Slug: "x"})
	if !errors.Is(err, domain.ErrInvalid) {
		t.Fatalf("expected ErrInvalid, got %v", err)
	}
}
