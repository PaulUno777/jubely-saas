package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

// RequireWritableSubscription blocks mutating routes when org subscription is frozen/past_due/etc.
func RequireWritableSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		raw, ok := c.Get(ginKeyAuthClaims)
		if !ok {
			c.Next()
			return
		}
		claims, ok := raw.(ports.TokenClaims)
		if !ok || claims.TenantID == nil {
			c.Next()
			return
		}
		if claims.ActiveRole() == domain.RoleSuperadmin {
			c.Next()
			return
		}
		st := strings.TrimSpace(claims.SubscriptionStatus)
		if st == "" || st == string(domain.SubscriptionActive) || st == string(domain.SubscriptionTrialing) {
			c.Next()
			return
		}
		respondError(c, http.StatusPaymentRequired, i18n.CodeSubscriptionInactive, gin.H{"status": st})
		c.Abort()
	}
}
