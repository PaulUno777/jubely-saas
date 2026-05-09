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
