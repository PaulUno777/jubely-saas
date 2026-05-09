package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type stubUserRepoForTenantUser struct {
	created *domain.User
	findErr error
}

func (s *stubUserRepoForTenantUser) Create(ctx context.Context, u *domain.User) error {
	cp := *u
	s.created = &cp
	return nil
}
func (s *stubUserRepoForTenantUser) CountSuperadmins(ctx context.Context) (int64, error) {
	return 0, nil
}
func (s *stubUserRepoForTenantUser) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (s *stubUserRepoForTenantUser) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	return nil, s.findErr
}
func (s *stubUserRepoForTenantUser) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (s *stubUserRepoForTenantUser) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustChangePassword bool) error {
	return nil
}
func (s *stubUserRepoForTenantUser) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	return 0, nil
}
func (s *stubUserRepoForTenantUser) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	return nil, nil
}

type stubHasherForTenantUser struct{}

func (stubHasherForTenantUser) Hash(p string) (string, error) { return "hash(" + p + ")", nil }
func (stubHasherForTenantUser) Compare(hash, plain string) error {
	if hash != "hash("+plain+")" {
		return errors.New("bad")
	}
	return nil
}

func TestCreateTenantUser_generates_temp_password_and_sets_must_change(t *testing.T) {
	t.Parallel()
	tenantID := uuid.New()
	tr := &stubTenantRepoForUsers{t: &domain.Tenant{ID: tenantID, Name: "Chez Mama", Slug: "chez-mama"}}
	ur := &stubUserRepoForTenantUser{findErr: domain.ErrNotFound}
	uc := &CreateTenantUser{Tenants: tr, Users: ur, Hasher: stubHasherForTenantUser{}}

	out, err := uc.Execute(context.Background(), CreateTenantUserInput{
		TenantID: tenantID,
		Email:    "admin@chezmama.cm",
		Role:     domain.RoleMerchantAdmin,
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if out.TempPassword == "" {
		t.Fatalf("expected temp password")
	}
	if ur.created == nil {
		t.Fatalf("expected user created")
	}
	if !ur.created.MustChangePassword {
		t.Fatalf("expected must_change_password")
	}
	if ur.created.TenantID == nil || *ur.created.TenantID != tenantID {
		t.Fatalf("expected tenant_id set")
	}
}

type stubTenantRepoForUsers struct {
	t *domain.Tenant
}

func (s *stubTenantRepoForUsers) Create(ctx context.Context, t *domain.Tenant) error { return nil }
func (s *stubTenantRepoForUsers) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	return nil, domain.ErrNotFound
}
func (s *stubTenantRepoForUsers) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	if s.t != nil && s.t.ID == id {
		return s.t, nil
	}
	return nil, domain.ErrNotFound
}
func (s *stubTenantRepoForUsers) Update(ctx context.Context, t *domain.Tenant) error { return nil }
func (s *stubTenantRepoForUsers) ListAll(ctx context.Context, offset, limit int) ([]domain.Tenant, error) {
	return nil, nil
}
func (s *stubTenantRepoForUsers) CountAll(ctx context.Context) (int64, error) { return 0, nil }
func (s *stubTenantRepoForUsers) CountActive(ctx context.Context) (int64, error) { return 0, nil }
func (s *stubTenantRepoForUsers) CountActiveByPlan(ctx context.Context, plan string) (int64, error) {
	_ = plan
	return 0, nil
}
