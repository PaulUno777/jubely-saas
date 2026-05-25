package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/google/uuid"
)

type enrollTestTenants struct {
	t *domain.Tenant
}

func (e enrollTestTenants) Create(ctx context.Context, t *domain.Tenant) error { return nil }
func (e enrollTestTenants) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	return nil, domain.ErrNotFound
}
func (e enrollTestTenants) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	if e.t != nil && id == e.t.ID {
		return e.t, nil
	}
	return nil, domain.ErrNotFound
}
func (e enrollTestTenants) Update(ctx context.Context, t *domain.Tenant) error { return nil }
func (e enrollTestTenants) ListAll(ctx context.Context, offset, limit int) ([]domain.Tenant, error) {
	return nil, nil
}
func (e enrollTestTenants) CountAll(ctx context.Context) (int64, error) { return 0, nil }
func (e enrollTestTenants) CountActive(ctx context.Context) (int64, error) { return 0, nil }
func (e enrollTestTenants) CountActiveByPlan(ctx context.Context, plan string) (int64, error) {
	return 0, nil
}

func TestEnrollByStoreQR_rejects_bad_phone_proof(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: time.Minute}
	tok, err := signer.SignPhoneEnrollmentProof(context.Background(), "+237699999999")
	if err != nil {
		t.Fatal(err)
	}
	uc := &EnrollByStoreQR{
		Tx:               noopTx{},
		Clock:            stubClock{t: time.Unix(1, 0)},
		Tenants:          enrollTestTenants{t: &domain.Tenant{ID: tid, Name: "X", Active: true}},
		Customers:        &memCustomerRepo{},
		Enrollments:      &memEnrollmentRepo{},
		QRCodec:          stubQRCodecForTenant{tid: tid},
		PhoneProofParser: signer,
	}

	_, err = uc.Execute(context.Background(), EnrollByStoreQRInput{
		StoreQR:          "any",
		PhoneE164:        "+237600000010",
		Name:             "Sam",
		PhoneVerifyToken: tok,
	})
	if !errors.Is(err, domain.ErrUnauthorized) {
		t.Fatalf("expected ErrUnauthorized, got %v", err)
	}
}

type stubQRCodecForTenant struct {
	tid uuid.UUID
}

func (s stubQRCodecForTenant) SignStoreQR(ctx context.Context, tenantID uuid.UUID) (string, error) {
	return "qr", nil
}

func (s stubQRCodecForTenant) ParseStoreQR(ctx context.Context, token string) (uuid.UUID, error) {
	return s.tid, nil
}

func (s stubQRCodecForTenant) SignCustomerQR(ctx context.Context, tenantID, customerID uuid.UUID) (string, error) {
	return "cqr", nil
}

func (s stubQRCodecForTenant) ParseCustomerQR(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	return s.tid, uuid.New(), nil
}
