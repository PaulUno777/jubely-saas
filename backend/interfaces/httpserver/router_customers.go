package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerCustomerRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	customers := v1.Group("/customers")
	customers.GET("/wallet", GinRateLimit(rateLimitPublicEnroll), s.CustomerGetWalletByQR)
	customersMe := customers.Group("/me")
	customersMe.Use(AuthMiddleware(signer))
	customersMe.GET("/wallet", s.CustomerGetMyWallet)
	customersMe.PATCH("/profile", s.CustomerPatchProfile)
	customersMe.GET("/rewards", s.CustomerListRewards)
	customersMe.POST("/reward-claims", RequireWritableSubscription(), s.CustomerClaimReward)
}

func registerOrganizationRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	org := v1.Group("/organizations/me")
	org.Use(AuthMiddleware(signer), RequireMerchantAdmin(), RequireWritableSubscription())
	org.GET("/stores", s.OrgListStores)
	org.POST("/stores", s.OrgCreateStore)
	org.GET("/subscription", s.OrgGetSubscription)
	org.POST("/subscription/invoices", s.OrgCreateMoMoInvoice)
	org.POST("/subscription/invoices/:invoiceId/confirmations", s.OrgConfirmMoMoInvoice)
}
