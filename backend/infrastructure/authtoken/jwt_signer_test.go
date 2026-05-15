package authtoken

import (
	"context"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

func TestJWTSigner_sign_and_parse_roundtrip(t *testing.T) {
	t.Parallel()
	tenantID := uuid.New()
	s := &JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:    10 * time.Minute,
	}
	want := ports.TokenClaims{
		UserID:   uuid.New(),
		TenantID: &tenantID,
		Role:     domain.RoleMerchantAdmin,
		Email:    "admin@chezmama.cm",
	}
	tok, err := s.SignAccessToken(context.Background(), want)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	got, err := s.ParseAccessToken(context.Background(), tok)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got.UserID != want.UserID {
		t.Fatalf("user_id mismatch")
	}
	if got.TenantID == nil || *got.TenantID != tenantID {
		t.Fatalf("tenant_id mismatch")
	}
	if got.Role != want.Role {
		t.Fatalf("role mismatch")
	}
	if got.Email != want.Email {
		t.Fatalf("email mismatch")
	}
	if got.MustChangePassword != want.MustChangePassword {
		t.Fatalf("mcp mismatch")
	}
	if got.MFAEnrolledCount != want.MFAEnrolledCount {
		t.Fatalf("mfa_ec mismatch: got %d want %d", got.MFAEnrolledCount, want.MFAEnrolledCount)
	}
}

func TestJWTSigner_must_change_password_claim_roundtrip(t *testing.T) {
	t.Parallel()
	s := &JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:    10 * time.Minute,
	}
	want := ports.TokenClaims{
		UserID:             uuid.New(),
		Role:               domain.RoleSuperadmin,
		Email:              "root@jubely.app",
		MustChangePassword: true,
		MFAEnrolledCount:   2,
	}
	tok, err := s.SignAccessToken(context.Background(), want)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	got, err := s.ParseAccessToken(context.Background(), tok)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if !got.MustChangePassword {
		t.Fatalf("expected MustChangePassword true")
	}
	if got.MFAEnrolledCount != 2 {
		t.Fatalf("expected MFAEnrolledCount 2, got %d", got.MFAEnrolledCount)
	}
}

func TestJWTSigner_parse_rejects_tampered(t *testing.T) {
	t.Parallel()
	s := &JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:    10 * time.Minute,
	}
	tok, err := s.SignAccessToken(context.Background(), ports.TokenClaims{
		UserID: uuid.New(),
		Role:   domain.RoleSuperadmin,
		Email:  "root@jubely.app",
	})
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	// Tamper with signature.
	tok = tok + "x"
	if _, err := s.ParseAccessToken(context.Background(), tok); err == nil {
		t.Fatalf("expected parse error")
	}
}

func TestJWTSigner_perms_roundtrip(t *testing.T) {
	t.Parallel()
	s := &JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:    10 * time.Minute,
	}
	perms := []string{domain.PermManageStaff, domain.PermRecordTransaction}
	tok, err := s.SignAccessToken(context.Background(), ports.TokenClaims{
		UserID:      uuid.New(),
		Role:        domain.RoleStaff,
		Email:       "staff@store.cm",
		Permissions: perms,
	})
	if err != nil {
		t.Fatal(err)
	}
	got, err := s.ParseAccessToken(context.Background(), tok)
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Permissions) != 2 || got.Permissions[0] != perms[0] || got.Permissions[1] != perms[1] {
		t.Fatalf("perms: %#v", got.Permissions)
	}
}

func TestJWTSigner_phone_enrollment_proof_roundtrip(t *testing.T) {
	t.Parallel()
	s := &JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:    10 * time.Minute,
	}
	phone := "+237611111111"
	tok, err := s.SignPhoneEnrollmentProof(context.Background(), phone)
	if err != nil {
		t.Fatal(err)
	}
	got, err := s.ParsePhoneEnrollmentProof(context.Background(), tok)
	if err != nil || got != phone {
		t.Fatalf("got %q err=%v", got, err)
	}
}
