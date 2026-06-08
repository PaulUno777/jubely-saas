package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerMeRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	me := v1.Group("/me")
	me.Use(AuthMiddleware(signer))
	me.PATCH("/credentials/password", s.MeChangePassword)

	meMFA := me.Group("/mfa")
	meMFA.Use(RequireAdminPortal())
	meMFA.GET("", s.MeListMFA)
	meMFA.POST("/totp/setup", s.MeSetupTOTP)
	meMFA.POST("/totp/confirm", s.MeConfirmTOTP)
	meMFA.DELETE("/factors/:id", s.MeDeleteFactor)
	meMFA.POST("/passkey/register/begin", s.MePasskeyRegisterBegin)
	meMFA.POST("/passkey/register/finish", s.MePasskeyRegisterFinish)
}
