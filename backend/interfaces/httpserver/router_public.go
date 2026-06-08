package httpserver

import "github.com/gin-gonic/gin"

func registerPublicRoutes(v1 *gin.RouterGroup, s *Server) {
	public := v1.Group("/public")
	public.GET("/tenant/:slug", GinRateLimit(rateLimitPublicTenant), s.PublicGetTenantBySlug)
	public.POST("/phone-verifications", GinRateLimit(rateLimitPublicOTPSend), s.PublicPhoneVerificationCreate)
	public.POST("/phone-verifications/:id/confirmations", GinRateLimit(rateLimitPublicOTPVerify), s.PublicPhoneVerificationConfirm)
	public.POST("/enrollments", GinRateLimit(rateLimitPublicEnroll), s.PublicCreateEnrollment)
	public.GET("/plans", s.PublicListPlans)
	public.POST("/merchant-applications", GinRateLimit(rateLimitPublicSignup), s.PublicStoreSignup)
	public.GET("/locations/nearby", GinRateLimit(rateLimitPublicTenant), s.PublicListNearbyLocations)
	public.GET("/files/*filepath", s.PublicServeUpload)
}
