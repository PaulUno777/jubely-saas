package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
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
		if claims.Role != domain.RoleSuperadmin || claims.TenantID != nil {
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
		if claims.Role != domain.RoleStaff && claims.Role != domain.RoleMerchantAdmin {
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
		if claims.TenantID == nil || claims.Role != domain.RoleMerchantAdmin {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
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
		if claims.Role != domain.RoleSuperadmin && claims.Role != domain.RoleMerchantAdmin {
			respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}
