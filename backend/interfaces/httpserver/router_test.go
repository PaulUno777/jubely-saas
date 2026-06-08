package httpserver

import (
	"fmt"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func routeKey(method, path string) string {
	return fmt.Sprintf("%s %s", method, path)
}

func TestRouter_registersKeyRoutes(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	signer := &authtoken.JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:  5 * time.Minute,
	}
	r := NewRouter(signer, &Server{})

	registered := make(map[string]struct{}, len(r.Routes()))
	for _, rt := range r.Routes() {
		registered[routeKey(rt.Method, rt.Path)] = struct{}{}
	}

	required := []struct {
		method string
		path   string
	}{
		{"GET", "/health"},
		{"GET", "/v1/public/tenant/:slug"},
		{"POST", "/v1/sessions"},
		{"GET", "/v1/superadmin/tenants"},
		{"GET", "/v1/tenants/:tenantId/customers"},
		{"GET", "/v1/tenants/:tenantId/campaigns"},
		{"POST", "/v1/staff/transactions"},
		{"GET", "/v1/me/mfa"},
		{"POST", "/v1/public/phone-verifications"},
		{"GET", "/v1/tenants/:tenantId/enrollment-qr"},
		{"GET", "/v1/tenants/:tenantId/subscription"},
	}

	for _, want := range required {
		key := routeKey(want.method, want.path)
		if _, ok := registered[key]; !ok {
			t.Errorf("expected route %q to be registered", key)
		}
	}

	removed := []struct {
		method string
		path   string
	}{
		{"GET", "/v1/store/metrics"},
		{"POST", "/v1/auth/login"},
		{"POST", "/v1/staff/purchases"},
		{"GET", "/v1/organizations/me/stores"},
		{"GET", "/v1/organizations/me/subscription"},
	}
	for _, gone := range removed {
		key := routeKey(gone.method, gone.path)
		if _, ok := registered[key]; ok {
			t.Errorf("expected legacy route %q to be removed", key)
		}
	}
}

func TestRouter_routeCount(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	signer := &authtoken.JWTSigner{
		Secret: []byte("01234567890123456789012345678901"),
		TTL:  5 * time.Minute,
	}
	r := NewRouter(signer, &Server{})

	const wantMin = 86
	if n := len(r.Routes()); n < wantMin {
		t.Errorf("expected at least %d routes, got %d", wantMin, n)
	}
}
