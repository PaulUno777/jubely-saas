package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerSuperadminRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	superadmin := v1.Group("/superadmin")
	superadmin.Use(AuthMiddleware(signer), RequireSuperadmin())
	superadmin.GET("/tenants", s.AdminListTenants)
	superadmin.POST("/tenants", s.AdminCreateTenant)
	superadmin.GET("/tenants/:tenantId", s.AdminGetTenant)
	superadmin.PATCH("/tenants/:tenantId", s.AdminPatchTenant)
	superadmin.GET("/tenants/:tenantId/users", s.AdminListTenantUsers)
	superadmin.POST("/tenants/:tenantId/users", s.AdminCreateTenantUser)
	superadmin.POST("/tenants/:tenantId/invitations", s.AdminCreateMerchantInvitation)
	superadmin.GET("/tenants/:tenantId/enrollment-qr", s.AdminGetStoreQR)
	superadmin.GET("/stats", s.SuperadminStats)
	superadmin.POST("/uploads/tenant-logo", s.AdminUploadTenantLogo)
}
