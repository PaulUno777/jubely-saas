package middleware

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/response"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func RequireWritableSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		claims, ok := Claims(c)
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
		response.Error(c, http.StatusPaymentRequired, i18n.CodeSubscriptionInactive, gin.H{"status": st})
		c.Abort()
	}
}
