package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/campaign"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/middleware"
	"github.com/gin-gonic/gin"
)

type Server struct {
	BootstrapUC           *auth.BootstrapSuperadmin
	LoginUC               *auth.Login
	SelectWorkspaceUC     *auth.SelectWorkspace
	RefreshUC             *auth.RefreshAuth
	LogoutUC              *auth.Logout
	StoreSignupUC         *tenant.StoreSignup
	CreateTenantUC        *tenant.CreateTenant
	ListTenantsUC         *tenant.ListTenants
	UpdateTenantUC        *tenant.UpdateTenant
	ListTenantUsersUC     *tenant.ListTenantUsers
	CreateInvitationUC    *tenant.CreateMerchantInvitation
	AcceptInvitationUC    *tenant.AcceptMerchantInvitation
	CreateTenantUserUC    *tenant.CreateTenantUser
	SuperadminStatsUC     *tenant.SuperadminStats
	CreateCustomerUC      *loyalty.CreateCustomerByStaff
	EnrollByStoreQRUC     *loyalty.EnrollByStoreQR
	GetCustomerWalletUC   *loyalty.GetCustomerWallet
	CustomerLoginUC       *auth.CustomerLogin
	SelectCustomerContextUC *auth.SelectCustomerContext
	StaffRecordPurchaseUC   *staff.StaffRecordPurchase
	StaffValidateRedemptionUC *staff.StaffValidateRedemption
	ListStoreRewardsUC      *loyalty.ListStoreRewards
	CreateStoreRewardUC     *loyalty.CreateStoreReward
	PatchStoreRewardUC      *loyalty.PatchStoreReward
	ListCustomerRewardsUC   *loyalty.ListCustomerRewards
	CustomerClaimRewardUC   *loyalty.CustomerClaimReward
	ListStoreRulesUC        *loyalty.ListStoreRules
	CreateStoreRuleUC       *loyalty.CreateStoreRule
	PatchStoreRuleUC        *loyalty.PatchStoreRule
	DeleteStoreRuleUC       *loyalty.DeleteStoreRule
	GetRulesHealthUC        *loyalty.GetRulesHealth
	ListRuleVersionsUC      *loyalty.ListRuleVersions
	RestoreRuleVersionUC    *loyalty.RestoreRuleVersion
	SimulateStoreRulesUC    *loyalty.SimulateStoreRules
	ListStoreCustomersUC  *loyalty.ListStoreCustomers
	ListStorePointEventsUC *loyalty.ListStorePointEvents
	ListOrgStoresUC        *tenant.ListOrgStores
	CreateOrgStoreUC       *tenant.CreateOrgStore
	GetOrgSubscriptionUC   *billing.GetOrgSubscription
	CreateMoMoInvoiceUC    *billing.CreateMoMoInvoice
	ConfirmMoMoInvoiceUC   *billing.ConfirmMoMoInvoice
	ListPlansUC            *billing.ListPlans
	PublicCustomerOTP     *auth.PublicCustomerOTP
	SetupTOTPUC           *auth.SetupTOTP
	ConfirmTOTPUC         *auth.ConfirmTOTP
	BeginPasskeyRegUC     *auth.BeginPasskeyRegistration
	FinishPasskeyRegUC    *auth.FinishPasskeyRegistration
	BeginPasskeyAuthUC    *auth.BeginPasskeyAuthentication
	FinishPasskeyAuthUC   *auth.FinishPasskeyAuthentication
	VerifyTOTPLoginUC     *auth.VerifyLoginTOTP
	FinishPasskeyLoginUC  *auth.FinishLoginPasskey
	MFASigner             *authtoken.JWTSigner
	ChangePasswordUC      *auth.ChangePassword
	AccessSigner          ports.TokenSigner

	GetTenantUC           *tenant.GetTenant
	PreviewInvitationUC   *tenant.PreviewInvitation
	GetEnrollmentQRUC     *loyalty.GetEnrollmentQR
	ListNearbyLocationsUC *tenant.ListNearbyLocations
	SetLocationHQUC       *tenant.SetLocationHQ
	QueryTenantMetricsUC  *analytics.QueryTenantMetrics

	StripeWebhookSecret string

	// CORSAllowAll enables permissive CORS for local dev.
	CORSAllowAll bool

	// Local uploads: directory on disk; used when FILE_STORAGE_DRIVER=local (or default with ASSET_UPLOAD_DIR).
	AssetUploadDir string
	// UploadTenantLogoUC optional; nil when object storage is not configured.
	UploadTenantLogoUC *tenant.UploadTenantLogo

	UpdateCustomerProfileUC   *loyalty.UpdateCustomerProfile
	ListTiersUC               *loyalty.ListTiers
	UpsertTierUC              *loyalty.UpsertTier
	SeedDefaultTiersUC        *loyalty.SeedDefaultTiers
	ValidateStoreRulesUC      *loyalty.ValidateStoreRules
	GetQRBrandingUC           *tenant.GetQRBranding
	PutQRBrandingUC           *tenant.PutQRBranding
	GetTenantLocalesUC        *tenant.GetTenantLocales
	PutTenantLocalesUC        *tenant.PutTenantLocales
	ListCampaignsUC           *campaign.ListCampaigns
	GetCampaignUC             *campaign.GetCampaign
	CreateCampaignUC          *campaign.CreateCampaign
	UpdateCampaignUC          *campaign.UpdateCampaign
	LaunchCampaignUC          *campaign.LaunchCampaign
	PauseCampaignUC           *campaign.PauseCampaign
	GetTenantCustomerUC       *loyalty.GetTenantCustomer
	AdjustCustomerPointsUC    *loyalty.AdjustCustomerPoints
	TenantAnalyticsOverviewUC *analytics.TenantAnalyticsOverview
	MemberGrowthUC            *analytics.MemberGrowth
	TierDistributionUC        *analytics.TierDistribution
	HourlyHeatmapUC           *analytics.HourlyHeatmap
	TopRewardsUC              *analytics.TopRewards
	RetentionCohortsUC        *analytics.RetentionCohorts
	UploadRewardImageUC       *loyalty.UploadRewardImage
}

func (s *Server) Health(c *gin.Context) {
	respondOK(c, gin.H{"status": "ok"})
}

// Claims is a helper for handlers.
func Claims(c *gin.Context) (ports.TokenClaims, bool) {
	return middleware.Claims(c)
}
