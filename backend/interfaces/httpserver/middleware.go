package httpserver

import (
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

const ginKeyAuthClaims = "auth_claims"

func AuthMiddleware(signer *authtoken.JWTSigner) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := strings.TrimSpace(c.GetHeader("Authorization"))
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			respondError(c, 401, i18n.CodeAuthUnauthorized)
			c.Abort()
			return
		}
		raw := strings.TrimSpace(parts[1])
		if raw == "" {
			respondError(c, 401, i18n.CodeAuthUnauthorized)
			c.Abort()
			return
		}
		claims, err := signer.ParseAccessToken(c.Request.Context(), raw)
		if err != nil {
			respondError(c, 401, i18n.CodeAuthUnauthorized)
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
			respondError(c, 401, i18n.CodeAuthUnauthorized)
			c.Abort()
			return
		}
		claims := raw.(ports.TokenClaims)
		if claims.Role != domain.RoleSuperadmin || claims.TenantID != nil {
			respondError(c, 403, i18n.CodeAuthForbidden)
			c.Abort()
			return
		}
		c.Next()
	}
}
