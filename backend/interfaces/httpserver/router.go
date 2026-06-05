package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/domain"
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
	{
		public := v1.Group("/public")
		public.GET("/tenant/:slug", GinRateLimit(rateLimitPublicTenant), s.PublicGetTenantBySlug)
		public.POST("/otp/send", GinRateLimit(rateLimitPublicOTPSend), s.PublicOTPSend)
		public.POST("/otp/verify", GinRateLimit(rateLimitPublicOTPVerify), s.PublicOTPVerify)
		public.POST("/enrollments", GinRateLimit(rateLimitPublicEnroll), s.PublicCreateEnrollment)
		public.GET("/plans", s.PublicListPlans)
		public.POST("/store/signup", GinRateLimit(rateLimitPublicSignup), s.PublicStoreSignup)
		public.GET("/locations/nearby", GinRateLimit(rateLimitPublicTenant), s.PublicListNearbyLocations)
		public.GET("/files/*filepath", s.PublicServeUpload)

		v1.POST("/webhooks/stripe", s.StripeWebhook)

		v1.POST("/bootstrap/superadmin", GinRateLimit(rateLimitBootstrap), s.BootstrapSuperadmin)
		v1.POST("/auth/login", GinRateLimit(rateLimitLogin), s.AuthLogin)
		v1.POST("/auth/customer/login", GinRateLimit(rateLimitPublicOTPVerify), s.CustomerAuthLogin)
		v1.POST("/auth/customer/session", AuthMiddleware(signer), s.CustomerSelectSession)
		v1.POST("/auth/workspace", AuthMiddleware(signer), s.AuthSelectWorkspace)
		v1.POST("/auth/mfa/totp/verify", s.AuthMFATOTPVerify)
		v1.POST("/auth/refresh", s.AuthRefresh)
		v1.POST("/auth/logout", s.AuthLogout)
		v1.POST("/auth/mfa/passkey/begin", s.AuthPasskeyBegin)
		v1.POST("/auth/mfa/passkey/finish", s.AuthPasskeyFinish)

		v1.GET("/invitations/:token", s.InvitationPreview)
		v1.POST("/invitations/:token/accept", s.PostAcceptInvitation)

		superadmin := v1.Group("/superadmin")
		superadmin.Use(AuthMiddleware(signer), RequireSuperadmin())
		superadmin.GET("/tenants", s.AdminListTenants)
		superadmin.POST("/tenants", s.AdminCreateTenant)
		superadmin.GET("/tenants/:tenantId", s.AdminGetTenant)
		superadmin.PATCH("/tenants/:tenantId", s.AdminPatchTenant)
		superadmin.GET("/tenants/:tenantId/users", s.AdminListTenantUsers)
		superadmin.POST("/tenants/:tenantId/users", s.AdminCreateTenantUser)
		superadmin.POST("/tenants/:tenantId/invitations", s.AdminCreateMerchantInvitation)
		superadmin.GET("/tenants/:tenantId/store-qr", s.AdminGetStoreQR)
		superadmin.GET("/stats", s.SuperadminStats)
		superadmin.POST("/uploads/tenant-logo", s.AdminUploadTenantLogo)

		customers := v1.Group("/customers")
		customers.GET("/wallet", GinRateLimit(rateLimitPublicEnroll), s.CustomerGetWalletByQR)
		customersMe := customers.Group("/me")
		customersMe.Use(AuthMiddleware(signer))
		customersMe.GET("/wallet", s.CustomerGetMyWallet)
		customersMe.PATCH("/profile", s.CustomerPatchProfile)
		customersMe.GET("/rewards", s.CustomerListRewards)
		customersMe.POST("/rewards/:rewardId/claims", RequireWritableSubscription(), s.CustomerClaimReward)

		org := v1.Group("/organizations/me")
		org.Use(AuthMiddleware(signer), RequireMerchantAdmin(), RequireWritableSubscription())
		org.GET("/stores", s.OrgListStores)
		org.POST("/stores", s.OrgCreateStore)
		org.GET("/subscription", s.OrgGetSubscription)
		org.POST("/subscription/momo-invoice", s.OrgCreateMoMoInvoice)
		org.POST("/subscription/confirm-momo", s.OrgConfirmMoMoInvoice)

		store := v1.Group("/store")
		store.Use(AuthMiddleware(signer), RequireMerchantAdmin())
		store.GET("/metrics", s.StoreGetMetrics)
		store.GET("/tenant", s.StoreGetTenant)
		store.PATCH("/tenant", s.StorePatchTenant)
		store.GET("/qr", s.StoreGetStoreQR)
		store.GET("/users", s.StoreListUsers)
		store.GET("/customers", s.StoreListCustomers)
		store.GET("/transactions", s.StoreListPointEvents)
		store.GET("/rewards", s.StoreListRewards)
		store.POST("/rewards", s.StoreCreateReward)
		store.PATCH("/rewards/:rewardId", s.StorePatchReward)
		store.GET("/rules", s.StoreListRules)
		store.POST("/rules", s.StoreCreateRule)
		store.PATCH("/rules/:ruleId", s.StorePatchRule)
		store.POST("/rules/simulate", s.StoreSimulateRules)
		store.POST("/invitations", s.StoreCreateInvitation)

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
		tenants.POST("/rules/simulate", RequirePermission(domain.PermManageRules), s.TenantSimulateRules)
		tenants.POST("/rules/validate", RequirePermission(domain.PermManageRules), s.TenantValidateRules)

		tenants.GET("/tiers", RequirePermission(domain.PermManageRules), s.TenantListTiers)
		tenants.PUT("/tiers", RequirePermission(domain.PermManageRules), s.TenantUpsertTier)

		tenants.GET("/rewards", RequirePermission(domain.PermManageRewards), s.TenantListRewards)
		tenants.POST("/rewards/:rewardId/image", RequirePermission(domain.PermManageRewards), s.TenantUploadRewardImage)

		tenants.GET("/qr/branding", s.TenantGetQRBranding)
		tenants.PUT("/qr/branding", s.TenantPutQRBranding)
		tenants.GET("/qr/token", s.TenantGetStoreQR)
		tenants.GET("/qr/render.svg", s.TenantRenderQR)

		tenants.GET("/settings/locales", s.TenantGetLocales)
		tenants.PUT("/settings/locales", s.TenantPutLocales)

		tenants.GET("/campaigns", RequirePermission(domain.PermViewAnalytics), s.TenantListCampaigns)
		tenants.POST("/campaigns", RequirePermission(domain.PermManageStaff), s.TenantCreateCampaign)
		tenants.GET("/campaigns/:campaignId", RequirePermission(domain.PermViewAnalytics), s.TenantGetCampaign)
		tenants.PATCH("/campaigns/:campaignId", RequirePermission(domain.PermManageStaff), s.TenantUpdateCampaign)
		tenants.POST("/campaigns/:campaignId/launch", RequirePermission(domain.PermManageStaff), s.TenantLaunchCampaign)
		tenants.POST("/campaigns/:campaignId/pause", RequirePermission(domain.PermManageStaff), s.TenantPauseCampaign)

		analytics := tenants.Group("/analytics")
		analytics.Use(RequirePermission(domain.PermViewAnalytics))
		analytics.GET("/overview", s.TenantAnalyticsOverview)
		analytics.GET("/member-growth", s.TenantAnalyticsMemberGrowth)
		analytics.GET("/tier-distribution", s.TenantAnalyticsTierDistribution)
		analytics.GET("/hourly-heatmap", s.TenantAnalyticsHeatmap)
		analytics.GET("/top-rewards", s.TenantAnalyticsTopRewards)
		analytics.GET("/retention-cohorts", s.TenantAnalyticsRetention)

		staff := v1.Group("/staff")
		staff.Use(AuthMiddleware(signer), RequireStaffOrMerchantAdmin(), RequireWritableSubscription())
		staff.POST("/customers", RequirePermission(domain.PermEnrollCustomer), s.StaffCreateCustomer)
		staff.POST("/purchases", RequirePermission(domain.PermRecordTransaction), s.StaffRecordPurchase)
		staff.POST("/redemptions/validate", RequirePermission(domain.PermRecordTransaction), s.StaffValidateRedemption)

		me := v1.Group("/me")
		me.Use(AuthMiddleware(signer))
		me.POST("/password", s.MeChangePassword)

		meMFA := me.Group("/mfa")
		meMFA.Use(RequireAdminPortal())
		meMFA.GET("", s.MeListMFA)
		meMFA.POST("/totp/setup", s.MeSetupTOTP)
		meMFA.POST("/totp/confirm", s.MeConfirmTOTP)
		meMFA.DELETE("/factors/:id", s.MeDeleteFactor)
		meMFA.POST("/passkey/register/begin", s.MePasskeyRegisterBegin)
		meMFA.POST("/passkey/register/finish", s.MePasskeyRegisterFinish)
	}

	return r
}
