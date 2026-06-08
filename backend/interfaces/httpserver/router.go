package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func NewRouter(signer *authtoken.JWTSigner, s *Server) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), SecurityHeaders())
	if s != nil && s.CORSAllowAll {
		r.Use(CORSAllowAll())
	}
	r.Use(RequestIDMiddleware(), LocaleMiddleware())

	r.GET("/health", s.Health)

	v1 := r.Group("/v1")
	registerPublicRoutes(v1, s)
	registerWebhookRoutes(v1, s)
	registerAuthRoutes(v1, signer, s)
	registerInvitationRoutes(v1, s)
	registerSuperadminRoutes(v1, signer, s)
	registerCustomerRoutes(v1, signer, s)
	registerOrganizationRoutes(v1, signer, s)
	registerTenantRoutes(v1, signer, s)
	registerStaffRoutes(v1, signer, s)
	registerMeRoutes(v1, signer, s)

	return r
}
