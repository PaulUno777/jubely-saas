package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func registerTenantRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	tenants := v1.Group("/tenants/:tenantId")
	tenants.Use(AuthMiddleware(signer), RequireMerchantAdmin(), RequireTenantScope())
	tenants.GET("/metrics", RequirePermission(domain.PermViewAnalytics), s.TenantGetMetrics)
	tenants.GET("/metrics/loyalty-activity", RequirePermission(domain.PermViewAnalytics), s.TenantGetLoyaltyActivity)
	tenants.GET("/stats", s.TenantGetStats)
	tenants.GET("/locations", s.TenantListLocations)
	tenants.POST("/locations", s.TenantCreateLocation)
	tenants.PATCH("/locations/:locationId", s.TenantPatchLocation)

	tenants.GET("/customers", RequirePermission(domain.PermViewAnalytics), s.TenantListCustomers)
	tenants.GET("/customers/:enrollmentId", RequirePermission(domain.PermViewAnalytics), s.TenantGetCustomer)
	tenants.POST("/customers/:enrollmentId/adjustments", RequirePermission(domain.PermManageStaff), s.TenantAdjustCustomerPoints)

	tenants.GET("/transactions", RequirePermission(domain.PermViewAnalytics), s.TenantListTransactions)
	tenants.GET("/agents", RequirePermission(domain.PermManageStaff), s.TenantListAgents)

	tenants.GET("/rules", RequirePermission(domain.PermManageRules), s.TenantListRules)
	tenants.POST("/rules", RequirePermission(domain.PermManageRules), s.TenantCreateRule)
	tenants.PATCH("/rules/:ruleId", RequirePermission(domain.PermManageRules), s.TenantPatchRule)
	tenants.POST("/rule-simulations", RequirePermission(domain.PermManageRules), s.TenantSimulateRules)
	tenants.POST("/rule-validations", RequirePermission(domain.PermManageRules), s.TenantValidateRules)

	tenants.GET("/tiers", RequirePermission(domain.PermManageRules), s.TenantListTiers)
	tenants.PUT("/tiers/:tierCode", RequirePermission(domain.PermManageRules), s.TenantUpsertTier)

	tenants.GET("/rewards", RequirePermission(domain.PermManageRewards), s.TenantListRewards)
	tenants.POST("/rewards", RequirePermission(domain.PermManageRewards), s.TenantCreateReward)
	tenants.PATCH("/rewards/:rewardId", RequirePermission(domain.PermManageRewards), s.TenantPatchReward)
	tenants.PUT("/rewards/:rewardId/image", RequirePermission(domain.PermManageRewards), s.TenantUploadRewardImage)

	tenants.GET("/qr/branding", s.TenantGetQRBranding)
	tenants.PUT("/qr/branding", s.TenantPutQRBranding)
	tenants.GET("/enrollment-qr", s.TenantGetStoreQR)
	tenants.GET("/enrollment-qr/render", s.TenantRenderQR)

	tenants.GET("/settings", s.TenantGetSettings)
	tenants.PATCH("/settings", s.TenantPatchSettings)
	tenants.GET("/settings/locales", s.TenantGetLocales)
	tenants.PUT("/settings/locales", s.TenantPutLocales)

	tenants.POST("/invitations", RequirePermission(domain.PermManageStaff), s.TenantCreateInvitation)

	tenants.GET("/campaigns", RequirePermission(domain.PermViewAnalytics), s.TenantListCampaigns)
	tenants.POST("/campaigns", RequirePermission(domain.PermManageStaff), s.TenantCreateCampaign)
	tenants.GET("/campaigns/:campaignId", RequirePermission(domain.PermViewAnalytics), s.TenantGetCampaign)
	tenants.PATCH("/campaigns/:campaignId", RequirePermission(domain.PermManageStaff), s.TenantUpdateCampaign)

	analytics := tenants.Group("/analytics")
	analytics.Use(RequirePermission(domain.PermViewAnalytics))
	analytics.GET("/overview", s.TenantAnalyticsOverview)
	analytics.GET("/member-growth", s.TenantAnalyticsMemberGrowth)
	analytics.GET("/tier-distribution", s.TenantAnalyticsTierDistribution)
	analytics.GET("/hourly-heatmap", s.TenantAnalyticsHeatmap)
	analytics.GET("/top-rewards", s.TenantAnalyticsTopRewards)
	analytics.GET("/retention-cohorts", s.TenantAnalyticsRetention)
}

func registerStaffRoutes(v1 *gin.RouterGroup, signer *authtoken.JWTSigner, s *Server) {
	staff := v1.Group("/staff")
	staff.Use(AuthMiddleware(signer), RequireStaffOrMerchantAdmin(), RequireWritableSubscription())
	staff.POST("/customers", RequirePermission(domain.PermEnrollCustomer), s.StaffCreateCustomer)
	staff.POST("/transactions", RequirePermission(domain.PermRecordTransaction), s.StaffRecordPurchase)
	staff.POST("/redemption-validations", RequirePermission(domain.PermRecordTransaction), s.StaffValidateRedemption)
}

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
