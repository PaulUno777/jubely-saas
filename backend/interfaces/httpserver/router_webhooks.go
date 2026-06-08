package httpserver

import "github.com/gin-gonic/gin"

func registerWebhookRoutes(v1 *gin.RouterGroup, s *Server) {
	v1.POST("/webhooks/stripe", s.StripeWebhook)
}
