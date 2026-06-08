package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerStaffRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	staff := v1.Group("/staff")
	staff.Use(AuthMiddleware(signer), RequireStaffOrMerchantAdmin(), RequireWritableSubscription())
	staff.POST("/customers", RequirePermission(domain.PermEnrollCustomer), s.StaffCreateCustomer)
	staff.POST("/transactions", RequirePermission(domain.PermRecordTransaction), s.StaffRecordPurchase)
	staff.POST("/redemption-validations", RequirePermission(domain.PermRecordTransaction), s.StaffValidateRedemption)
}
