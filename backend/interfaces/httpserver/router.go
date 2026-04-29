package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func NewRouter(signer *authtoken.JWTSigner, s *Server) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/health", s.Health)

	v1 := r.Group("/v1")
	{
		v1.POST("/bootstrap/superadmin", s.BootstrapSuperadmin)
		v1.POST("/auth/login", s.AuthLogin)

		v1.GET("/invitations/:token", s.InvitationPreview)
		v1.POST("/invitations/:token/accept", s.PostAcceptInvitation)

		admin := v1.Group("/admin")
		admin.Use(AuthMiddleware(signer), RequireSuperadmin())
		admin.POST("/tenants", s.AdminCreateTenant)
		admin.POST("/tenants/:tenantId/invitations", s.AdminCreateMerchantInvitation)
	}

	return r
}
