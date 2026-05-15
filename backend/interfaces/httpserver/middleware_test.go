package httpserver

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestRequireSuperadmin_allows_superadmin(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: 5 * time.Minute}
	tok, _ := signer.SignAccessToken(context.Background(), tokenClaimsForTest(domain.RoleSuperadmin, nil))

	r := gin.New()
	r.GET("/x", AuthMiddleware(signer), RequireSuperadmin(), func(c *gin.Context) { c.Status(200) })

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestRequireSuperadmin_rejects_non_superadmin(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: 5 * time.Minute}
	tok, _ := signer.SignAccessToken(context.Background(), tokenClaimsForTest(domain.RoleMerchantAdmin, ptrTenantID()))

	r := gin.New()
	r.GET("/x", AuthMiddleware(signer), RequireSuperadmin(), func(c *gin.Context) { c.Status(200) })

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 403 {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func TestRequirePermission_rejects_missing_permission(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: 5 * time.Minute}
	tok, _ := signer.SignAccessToken(context.Background(), ports.TokenClaims{
		UserID:      uuid.New(),
		TenantID:    ptrTenantID(),
		Role:        domain.RoleMerchantAdmin,
		Email:       "admin@store.cm",
		Permissions: []string{domain.PermManageStaff},
	})

	r := gin.New()
	r.POST(
		"/x",
		AuthMiddleware(signer),
		RequireStaffOrMerchantAdmin(),
		RequirePermission(domain.PermRecordTransaction),
		func(c *gin.Context) { c.Status(200) },
	)

	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 403 {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func TestRequirePermission_allows_default_staff_transaction(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: 5 * time.Minute}
	tok, _ := signer.SignAccessToken(context.Background(), ports.TokenClaims{
		UserID:   uuid.New(),
		TenantID: ptrTenantID(),
		Role:     domain.RoleStaff,
		Email:    "staff@store.cm",
	})

	r := gin.New()
	r.POST(
		"/x",
		AuthMiddleware(signer),
		RequireStaffOrMerchantAdmin(),
		RequirePermission(domain.PermRecordTransaction),
		func(c *gin.Context) { c.Status(200) },
	)

	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

// helpers

func ptrTenantID() *uuid.UUID {
	id := uuid.New()
	return &id
}

func tokenClaimsForTest(role domain.Role, tenantID *uuid.UUID) ports.TokenClaims {
	return ports.TokenClaims{
		UserID:   uuid.New(),
		TenantID: tenantID,
		Role:     role,
		Email:    "test@jubely.app",
	}
}
