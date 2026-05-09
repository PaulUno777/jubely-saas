package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

type stubFactorRepo struct {
	rows map[uuid.UUID]*ports.MFAFactorRow
}

func (s *stubFactorRepo) CreateTOTP(ctx context.Context, in ports.CreateTOTPFactorInput) error {
	if s.rows == nil {
		s.rows = map[uuid.UUID]*ports.MFAFactorRow{}
	}
	s.rows[in.ID] = &ports.MFAFactorRow{
		MFAFactor: ports.MFAFactor{
			ID:        in.ID,
			UserID:    in.UserID,
			Type:      ports.MFAFactorTOTP,
			Label:     in.Label,
			CreatedAt: in.CreatedAt,
		},
		SecretEnc: in.SecretEnc,
	}
	return nil
}
func (s *stubFactorRepo) CreatePasskey(ctx context.Context, in ports.CreatePasskeyFactorInput) error {
	return nil
}
func (s *stubFactorRepo) FindByID(ctx context.Context, id uuid.UUID) (*ports.MFAFactorRow, error) {
	if s.rows == nil || s.rows[id] == nil {
		return nil, domain.ErrNotFound
	}
	return s.rows[id], nil
}
func (s *stubFactorRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactor, error) {
	return nil, nil
}
func (s *stubFactorRepo) ListEnabledTOTPByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactorRow, error) {
	return nil, nil
}
func (s *stubFactorRepo) ListEnabledPasskeysByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactorRow, error) {
	return nil, nil
}
func (s *stubFactorRepo) FindEnabledPasskeyByCredentialID(ctx context.Context, credentialID []byte) (*ports.MFAFactorRow, error) {
	return nil, domain.ErrNotFound
}
func (s *stubFactorRepo) TouchPasskey(ctx context.Context, id uuid.UUID, signCount int64, usedAt time.Time) error {
	return nil
}
func (s *stubFactorRepo) Enable(ctx context.Context, id uuid.UUID, enabledAt time.Time) error {
	if s.rows == nil || s.rows[id] == nil {
		return domain.ErrNotFound
	}
	s.rows[id].EnabledAt = &enabledAt
	return nil
}
func (s *stubFactorRepo) Delete(ctx context.Context, id uuid.UUID) error { return nil }
func (s *stubFactorRepo) CountEnabledByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	return 0, nil
}

func TestSetup_and_confirm_totp(t *testing.T) {
	t.Parallel()
	now := time.Now().UTC()
	key := []byte("01234567890123456789012345678901")
	repo := &stubFactorRepo{}

	setup := &SetupTOTP{Factors: repo, Clock: stubClock{t: now}, Key: key, Issuer: "Jubely"}
	userID := uuid.New()
	out, err := setup.Execute(context.Background(), SetupTOTPInput{UserID: userID, Email: "root@jubely.app"})
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	code, err := totp.GenerateCode(out.SecretB32, now)
	if err != nil {
		t.Fatalf("code: %v", err)
	}

	confirm := &ConfirmTOTP{Factors: repo, Clock: stubClock{t: now}, Key: key}
	if err := confirm.Execute(context.Background(), ConfirmTOTPInput{UserID: userID, FactorID: out.FactorID, Code: code}); err != nil {
		t.Fatalf("confirm: %v", err)
	}
	row, _ := repo.FindByID(context.Background(), out.FactorID)
	if row.EnabledAt == nil {
		t.Fatalf("expected enabled_at")
	}
}
