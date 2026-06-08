package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	httpmiddleware "github.com/PaulUno777/jubely-saas/backend/interfaces/http/middleware"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/query"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/response"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Pagination = response.Pagination
type MappedError = response.MappedError

func respondOK(c *gin.Context, data any)             { response.OK(c, data) }
func respondCreated(c *gin.Context, data any)      { response.Created(c, data) }
func respondPage(c *gin.Context, data any, p Pagination) { response.Page(c, data, p) }
func respondError(c *gin.Context, httpStatus int, code string, details any) {
	response.Error(c, httpStatus, code, details)
}
func respondMapped(c *gin.Context, m MappedError) { response.Mapped(c, m) }

func mapBootstrapError(err error) MappedError        { return response.MapBootstrapError(err) }
func mapLoginError(err error) MappedError              { return response.MapLoginError(err) }
func mapTenantError(err error) MappedError             { return response.MapTenantError(err) }
func mapPublicInvitationError(err error) MappedError   { return response.MapPublicInvitationError(err) }
func mapCustomerError(err error) MappedError           { return response.MapCustomerError(err) }

func AuthMiddleware(signer *authtoken.JWTSigner) gin.HandlerFunc { return httpmiddleware.Auth(signer) }
func RequireSuperadmin() gin.HandlerFunc                       { return httpmiddleware.RequireSuperadmin() }
func RequireStaffOrMerchantAdmin() gin.HandlerFunc             { return httpmiddleware.RequireStaffOrMerchantAdmin() }
func RequireMerchantAdmin() gin.HandlerFunc                    { return httpmiddleware.RequireMerchantAdmin() }
func RequirePermission(want string) gin.HandlerFunc            { return httpmiddleware.RequirePermission(want) }
func RequireTenantScope() gin.HandlerFunc                      { return httpmiddleware.RequireTenantScope() }
func RequireAdminPortal() gin.HandlerFunc                      { return httpmiddleware.RequireAdminPortal() }
func RequireWritableSubscription() gin.HandlerFunc             { return httpmiddleware.RequireWritableSubscription() }
func CORSAllowAll() gin.HandlerFunc                            { return httpmiddleware.CORSAllowAll() }
func SecurityHeaders() gin.HandlerFunc                         { return httpmiddleware.SecurityHeaders() }
func RequestIDMiddleware() gin.HandlerFunc                    { return httpmiddleware.RequestID() }
func LocaleMiddleware() gin.HandlerFunc                        { return httpmiddleware.Locale() }
func GinRateLimit(l *httpmiddleware.IPWindowLimiter) gin.HandlerFunc {
	return httpmiddleware.RateLimit(l)
}

var (
	rateLimitBootstrap       = httpmiddleware.RateLimitBootstrap
	rateLimitLogin           = httpmiddleware.RateLimitLogin
	rateLimitPublicSignup    = httpmiddleware.RateLimitPublicSignup
	rateLimitPublicEnroll    = httpmiddleware.RateLimitPublicEnroll
	rateLimitPublicTenant    = httpmiddleware.RateLimitPublicTenant
	rateLimitPublicOTPSend   = httpmiddleware.RateLimitPublicOTPSend
	rateLimitPublicOTPVerify = httpmiddleware.RateLimitPublicOTPVerify
)

func tenantIDFromScope(c *gin.Context) (uuid.UUID, bool) {
	return httpmiddleware.TenantIDFromScope(c)
}

func parseTenantMetricsQuery(c *gin.Context) (ports.TenantMetricsInput, bool) {
	return query.ParseTenantMetrics(c)
}

func parseNearbyQuery(c *gin.Context) (ports.NearbyLocationsQuery, bool) {
	return query.ParseNearby(c)
}

type tenantDateRange = query.TenantDateRange

func parseTenantDateRangeQuery(c *gin.Context) (tenantDateRange, bool) {
	return query.ParseTenantDateRange(c)
}
