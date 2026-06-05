package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware(signer *authtoken.JWTSigner) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := strings.TrimSpace(c.GetHeader("Authorization"))
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		raw := strings.TrimSpace(parts[1])
		if raw == "" {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, err := signer.ParseAccessToken(c.Request.Context(), raw)
		if err != nil {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		c.Set(ginKeyAuthClaims, claims)
		c.Next()
	}
}

func RequireSuperadmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleSuperadmin || claims.TenantID != nil {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireStaffOrMerchantAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.TenantID == nil {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleStaff && claims.ActiveRole() != domain.RoleMerchantAdmin {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireMerchantAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.TenantID == nil || claims.ActiveRole() != domain.RoleMerchantAdmin {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePermission(want string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		perms := claims.Permissions
		if len(perms) == 0 {
			perms = domain.DefaultPermissionsForRole(claims.ActiveRole())
		}
		if !domain.HasPermission(perms, want) {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireTenantScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok || claims.TenantID == nil {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		param := strings.TrimSpace(c.Param("tenantId"))
		tenantID, err := uuid.Parse(param)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
			c.Abort()
			return
		}
		if *claims.TenantID != tenantID {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Set(ginKeyTenantID, tenantID)
		c.Next()
	}
}

func tenantIDFromScope(c *gin.Context) (uuid.UUID, bool) {
	raw, ok := c.Get(ginKeyTenantID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := raw.(uuid.UUID)
	return id, ok
}

func RequireAdminPortal() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleSuperadmin && claims.ActiveRole() != domain.RoleMerchantAdmin {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}
