package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

func NewRouter(signer *authtoken.JWTSigner, s *Server) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
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
		public.POST("/store/signup", GinRateLimit(rateLimitPublicSignup), s.PublicStoreSignup)
		public.GET("/files/*filepath", s.PublicServeUpload)

		v1.POST("/bootstrap/superadmin", GinRateLimit(rateLimitBootstrap), s.BootstrapSuperadmin)
		v1.POST("/auth/login", GinRateLimit(rateLimitLogin), s.AuthLogin)
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

		// Backwards-compatible aliases (will be removed after clients migrate).
		admin := v1.Group("/admin")
		admin.Use(AuthMiddleware(signer), RequireSuperadmin())
		admin.GET("/tenants", s.AdminListTenants)
		admin.POST("/tenants", s.AdminCreateTenant)
		admin.GET("/tenants/:tenantId", s.AdminGetTenant)
		admin.PATCH("/tenants/:tenantId", s.AdminPatchTenant)
		admin.GET("/tenants/:tenantId/users", s.AdminListTenantUsers)
		admin.POST("/tenants/:tenantId/users", s.AdminCreateTenantUser)
		admin.POST("/tenants/:tenantId/invitations", s.AdminCreateMerchantInvitation)
		admin.GET("/tenants/:tenantId/store-qr", s.AdminGetStoreQR)
		admin.GET("/stats", s.SuperadminStats)
		admin.POST("/uploads/tenant-logo", s.AdminUploadTenantLogo)

		store := v1.Group("/store")
		store.Use(AuthMiddleware(signer), RequireMerchantAdmin())
		store.GET("/metrics", s.StoreGetMetrics)
		store.GET("/tenant", s.StoreGetTenant)
		store.PATCH("/tenant", s.StorePatchTenant)
		store.GET("/qr", s.StoreGetStoreQR)
		store.GET("/users", s.StoreListUsers)
		store.GET("/customers", s.StoreListCustomers)
		store.GET("/transactions", s.StoreListPointEvents)
		store.POST("/invitations", s.StoreCreateInvitation)

		staff := v1.Group("/staff")
		staff.Use(AuthMiddleware(signer), RequireStaffOrMerchantAdmin())
		staff.POST("/customers", RequirePermission(domain.PermEnrollCustomer), s.StaffCreateCustomer)
		staff.POST("/purchases", RequirePermission(domain.PermRecordTransaction), s.StaffRecordPurchase)

		pwa := v1.Group("/pwa")
		pwa.POST("/enrollments/scan", GinRateLimit(rateLimitPWAEnroll), s.PWAEnrollByStoreQR)
		pwa.GET("/wallet", GinRateLimit(rateLimitPWAEnroll), s.PWAGetWallet)

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
