package httpserver

import (
	"io"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

// StripeWebhook accepts Stripe events when STRIPE_WEBHOOK_SECRET is configured (Phase C).
// MVP: acknowledge payload; wire subscription sync in a follow-up when Stripe keys are set.
func (s *Server) StripeWebhook(c *gin.Context) {
	if s.StripeWebhookSecret == "" {
		respondError(c, http.StatusNotImplemented, i18n.CodeInternal, gin.H{"reason": "stripe_not_configured"})
		return
	}
	_, _ = io.ReadAll(c.Request.Body)
	c.Status(http.StatusOK)
}
