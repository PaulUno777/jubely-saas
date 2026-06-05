package usecase

import (
	"context"
	"crypto/sha256"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/google/uuid"
)

type stubRefreshRepo struct {
	rows map[string]ports.RefreshToken
}

func (s *stubRefreshRepo) Create(ctx context.Context, in ports.RefreshTokenCreateInput) error {
	if s.rows == nil {
		s.rows = map[string]ports.RefreshToken{}
	}
	k := string(in.TokenHash)
	s.rows[k] = ports.RefreshToken{
		ID:        in.ID,
		UserID:    in.UserID,
		TokenHash: in.TokenHash,
		ExpiresAt: in.ExpiresAt,
	}
	return nil
}

func (s *stubRefreshRepo) FindActiveByHash(ctx context.Context, tokenHash []byte) (*ports.RefreshToken, error) {
	if s.rows == nil {
		return nil, domain.ErrNotFound
	}
	r, ok := s.rows[string(tokenHash)]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if r.RevokedAt != nil || !time.Now().UTC().Before(r.ExpiresAt) {
		return nil, domain.ErrUnauthorized
	}
	cp := r
	return &cp, nil
}

func (s *stubRefreshRepo) RevokeByHash(ctx context.Context, tokenHash []byte, revokedAt time.Time) error {
	if s.rows == nil {
		return nil
	}
	r, ok := s.rows[string(tokenHash)]
	if !ok {
		return nil
	}
	r.RevokedAt = &revokedAt
	s.rows[string(tokenHash)] = r
	return nil
}

type stubUserRepoByID struct {
	u *domain.User
}

func (s *stubUserRepoByID) Create(ctx context.Context, u *domain.User) error    { return nil }
func (s *stubUserRepoByID) CountSuperadmins(ctx context.Context) (int64, error) { return 0, nil }
func (s *stubUserRepoByID) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (s *stubUserRepoByID) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (s *stubUserRepoByID) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	if s.u != nil && s.u.ID == id {
		return s.u, nil
	}
	return nil, domain.ErrNotFound
}
func (s *stubUserRepoByID) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustChangePassword bool) error {
	return nil
}
func (s *stubUserRepoByID) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	return 0, nil
}
func (s *stubUserRepoByID) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	return nil, nil
}

func TestRefresh_rotates_token(t *testing.T) {
	t.Parallel()
	now := time.Date(2026, 5, 6, 0, 0, 0, 0, time.UTC)
	clock := stubClock{t: now}
	user := &domain.User{ID: uuid.New(), Email: "root@jubely.app", Role: domain.RoleSuperadmin}
	users := &stubUserRepoByID{u: user}
	refreshRepo := &stubRefreshRepo{}
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: time.Hour}

	plain, hash, err := newRefreshToken()
	if err != nil {
		t.Fatalf("new refresh: %v", err)
	}
	if err := refreshRepo.Create(context.Background(), ports.RefreshTokenCreateInput{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hash,
		UserAgent: "ua",
		ExpiresAt: now.Add(365 * 24 * time.Hour),
	}); err != nil {
		t.Fatalf("seed: %v", err)
	}

	uc := &RefreshAuth{
		Users:         users,
		RefreshTokens: refreshRepo,
		Factors:       &stubFactorRepo{},
		Signer:        signer,
		Clock:         clock,
		TTL:           30 * 24 * time.Hour,
	}
	out, err := uc.Execute(context.Background(), RefreshAuthInput{RefreshToken: plain, UserAgent: "ua"})
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if out.RefreshToken == plain {
		t.Fatalf("expected rotated refresh token")
	}

	sum := sha256.Sum256([]byte(plain))
	r, _ := refreshRepo.rows[string(sum[:])]
	if r.RevokedAt == nil {
		t.Fatalf("expected old token revoked")
	}
}
