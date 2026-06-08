package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerAuthRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	v1.POST("/setup/superadmin", GinRateLimit(rateLimitBootstrap), s.BootstrapSuperadmin)

	sessions := v1.Group("/sessions")
	sessions.POST("", GinRateLimit(rateLimitLogin), s.AuthLogin)
	sessions.POST("/refresh", s.AuthRefresh)
	sessions.DELETE("/current", s.AuthLogout)
	sessions.PUT("/current/workspace", AuthMiddleware(signer), s.AuthSelectWorkspace)
	sessions.POST("/mfa/totp/verifications", s.AuthMFATOTPVerify)
	sessions.POST("/mfa/passkey/challenges", s.AuthPasskeyBegin)
	sessions.POST("/mfa/passkey/responses", s.AuthPasskeyFinish)

	customerSessions := v1.Group("/customer-sessions")
	customerSessions.POST("", GinRateLimit(rateLimitPublicOTPVerify), s.CustomerAuthLogin)
	customerSessions.PUT("/current", AuthMiddleware(signer), s.CustomerSelectSession)
}

func registerInvitationRoutes(v1 *gin.RouterGroup, s *Server) {
	v1.GET("/invitations/:token", s.InvitationPreview)
	v1.PATCH("/invitations/:token", s.PatchInvitation)
}
