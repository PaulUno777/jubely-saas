package tenant

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/testutil"
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
func (s *stubUserRepoForTenantUser) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, s.findErr
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
	tr := &testutil.StubTenantRepo{T: &domain.Tenant{ID: tenantID, Name: "Chez Mama", Slug: "chez-mama"}}
	ur := &stubUserRepoForTenantUser{findErr: domain.ErrNotFound}
	mr := &testutil.StubMembershipRepo{}
	uc := &CreateTenantUser{Tenants: tr, Users: ur, Memberships: mr, Hasher: stubHasherForTenantUser{}}

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
	if len(mr.Items) != 1 || mr.Items[0].TenantID != tenantID {
		t.Fatalf("expected membership created")
	}
}
