package middleware

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/contextkeys"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/response"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func Auth(signer *authtoken.JWTSigner) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := strings.TrimSpace(c.GetHeader("Authorization"))
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		raw := strings.TrimSpace(parts[1])
		if raw == "" {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		claims, err := signer.ParseAccessToken(c.Request.Context(), raw)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		c.Set(contextkeys.AuthClaims, claims)
		c.Next()
	}
}

func RequireSuperadmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleSuperadmin || claims.TenantID != nil {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireStaffOrMerchantAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.TenantID == nil {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleStaff && claims.ActiveRole() != domain.RoleMerchantAdmin {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireMerchantAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.TenantID == nil || claims.ActiveRole() != domain.RoleMerchantAdmin {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePermission(want string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		perms := claims.Permissions
		if len(perms) == 0 {
			perms = domain.DefaultPermissionsForRole(claims.ActiveRole())
		}
		if !domain.HasPermission(perms, want) {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireTenantScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok || claims.TenantID == nil {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		param := strings.TrimSpace(c.Param("tenantId"))
		tenantID, err := uuid.Parse(param)
		if err != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
			c.Abort()
			return
		}
		if *claims.TenantID != tenantID {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Set(contextkeys.TenantID, tenantID)
		c.Next()
	}
}

func TenantIDFromScope(c *gin.Context) (uuid.UUID, bool) {
	raw, ok := c.Get(contextkeys.TenantID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := raw.(uuid.UUID)
	return id, ok
}

func RequireAdminPortal() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
			c.Abort()
			return
		}
		if claims.ActiveRole() != domain.RoleSuperadmin && claims.ActiveRole() != domain.RoleMerchantAdmin {
			response.Error(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

// Claims reads auth claims from the Gin context.
func Claims(c *gin.Context) (ports.TokenClaims, bool) {
	raw, ok := c.Get(contextkeys.AuthClaims)
	if !ok {
		return ports.TokenClaims{}, false
	}
	claims, ok := raw.(ports.TokenClaims)
	return claims, ok
}
