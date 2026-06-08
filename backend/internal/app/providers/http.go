package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/campaign"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/httpserver"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/google/wire"
)

// HTTPSet wires the Gin router and net/http server.
var HTTPSet = wire.NewSet(
	wire.Struct(new(HTTPServerParams), "*"),
	ProvideHTTPServer,
	ProvideRouter,
	ProvideNetHTTPServer,
)

// HTTPServerParams groups injectable handler dependencies (unique types for Wire).
type HTTPServerParams struct {
	BootstrapUC             *auth.BootstrapSuperadmin
	LoginUC                   *auth.Login
	SelectWorkspaceUC         *auth.SelectWorkspace
	RefreshUC                 *auth.RefreshAuth
	LogoutUC                  *auth.Logout
	StoreSignupUC             *tenant.StoreSignup
	CreateTenantUC            *tenant.CreateTenant
	ListTenantsUC             *tenant.ListTenants
	UpdateTenantUC            *tenant.UpdateTenant
	ListTenantUsersUC         *tenant.ListTenantUsers
	CreateInvitationUC        *tenant.CreateMerchantInvitation
	AcceptInvitationUC        *tenant.AcceptMerchantInvitation
	CreateTenantUserUC        *tenant.CreateTenantUser
	SuperadminStatsUC         *tenant.SuperadminStats
	CreateCustomerUC          *loyalty.CreateCustomerByStaff
	EnrollByStoreQRUC         *loyalty.EnrollByStoreQR
	GetCustomerWalletUC       *loyalty.GetCustomerWallet
	CustomerLoginUC           *auth.CustomerLogin
	SelectCustomerContextUC   *auth.SelectCustomerContext
	StaffRecordPurchaseUC     *staff.StaffRecordPurchase
	StaffValidateRedemptionUC *staff.StaffValidateRedemption
	ListStoreRewardsUC        *loyalty.ListStoreRewards
	CreateStoreRewardUC       *loyalty.CreateStoreReward
	PatchStoreRewardUC        *loyalty.PatchStoreReward
	ListCustomerRewardsUC     *loyalty.ListCustomerRewards
	CustomerClaimRewardUC     *loyalty.CustomerClaimReward
	ListStoreRulesUC          *loyalty.ListStoreRules
	CreateStoreRuleUC         *loyalty.CreateStoreRule
	PatchStoreRuleUC          *loyalty.PatchStoreRule
	SimulateStoreRulesUC      *loyalty.SimulateStoreRules
	ListStoreCustomersUC      *loyalty.ListStoreCustomers
	ListStorePointEventsUC    *loyalty.ListStorePointEvents
	ListOrgStoresUC           *tenant.ListOrgStores
	CreateOrgStoreUC          *tenant.CreateOrgStore
	GetOrgSubscriptionUC      *billing.GetOrgSubscription
	CreateMoMoInvoiceUC       *billing.CreateMoMoInvoice
	ConfirmMoMoInvoiceUC      *billing.ConfirmMoMoInvoice
	ListPlansUC               *billing.ListPlans
	PublicCustomerOTP         *auth.PublicCustomerOTP
	SetupTOTPUC               *auth.SetupTOTP
	ConfirmTOTPUC             *auth.ConfirmTOTP
	BeginPasskeyRegUC         *auth.BeginPasskeyRegistration
	FinishPasskeyRegUC        *auth.FinishPasskeyRegistration
	BeginPasskeyAuthUC        *auth.BeginPasskeyAuthentication
	FinishPasskeyAuthUC       *auth.FinishPasskeyAuthentication
	VerifyTOTPLoginUC         *auth.VerifyLoginTOTP
	FinishPasskeyLoginUC      *auth.FinishLoginPasskey
	MFASigner                 *authtoken.JWTSigner
	ChangePasswordUC          *auth.ChangePassword
	AccessSigner              ports.TokenSigner
	GetTenantUC               *tenant.GetTenant
	PreviewInvitationUC       *tenant.PreviewInvitation
	GetEnrollmentQRUC         *loyalty.GetEnrollmentQR
	ListNearbyLocationsUC     *tenant.ListNearbyLocations
	SetLocationHQUC           *tenant.SetLocationHQ
	QueryTenantMetricsUC      *analytics.QueryTenantMetrics
	UploadTenantLogoUC        *tenant.UploadTenantLogo
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

// ProvideHTTPServer maps injected use cases and ports onto the Gin server facade.
func ProvideHTTPServer(cfg config.Config, p HTTPServerParams) *httpserver.Server {
	return &httpserver.Server{
		BootstrapUC:             p.BootstrapUC,
		LoginUC:                   p.LoginUC,
		SelectWorkspaceUC:         p.SelectWorkspaceUC,
		RefreshUC:                 p.RefreshUC,
		LogoutUC:                  p.LogoutUC,
		StoreSignupUC:             p.StoreSignupUC,
		CreateTenantUC:            p.CreateTenantUC,
		ListTenantsUC:             p.ListTenantsUC,
		UpdateTenantUC:            p.UpdateTenantUC,
		ListTenantUsersUC:         p.ListTenantUsersUC,
		CreateInvitationUC:        p.CreateInvitationUC,
		AcceptInvitationUC:        p.AcceptInvitationUC,
		CreateTenantUserUC:        p.CreateTenantUserUC,
		SuperadminStatsUC:         p.SuperadminStatsUC,
		CreateCustomerUC:          p.CreateCustomerUC,
		EnrollByStoreQRUC:         p.EnrollByStoreQRUC,
		GetCustomerWalletUC:       p.GetCustomerWalletUC,
		CustomerLoginUC:           p.CustomerLoginUC,
		SelectCustomerContextUC:   p.SelectCustomerContextUC,
		StaffRecordPurchaseUC:     p.StaffRecordPurchaseUC,
		StaffValidateRedemptionUC: p.StaffValidateRedemptionUC,
		ListStoreRewardsUC:        p.ListStoreRewardsUC,
		CreateStoreRewardUC:       p.CreateStoreRewardUC,
		PatchStoreRewardUC:        p.PatchStoreRewardUC,
		ListCustomerRewardsUC:     p.ListCustomerRewardsUC,
		CustomerClaimRewardUC:     p.CustomerClaimRewardUC,
		ListStoreRulesUC:          p.ListStoreRulesUC,
		CreateStoreRuleUC:         p.CreateStoreRuleUC,
		PatchStoreRuleUC:          p.PatchStoreRuleUC,
		SimulateStoreRulesUC:      p.SimulateStoreRulesUC,
		ListStoreCustomersUC:      p.ListStoreCustomersUC,
		ListStorePointEventsUC:    p.ListStorePointEventsUC,
		ListOrgStoresUC:           p.ListOrgStoresUC,
		CreateOrgStoreUC:          p.CreateOrgStoreUC,
		GetOrgSubscriptionUC:      p.GetOrgSubscriptionUC,
		CreateMoMoInvoiceUC:       p.CreateMoMoInvoiceUC,
		ConfirmMoMoInvoiceUC:      p.ConfirmMoMoInvoiceUC,
		ListPlansUC:               p.ListPlansUC,
		PublicCustomerOTP:         p.PublicCustomerOTP,
		SetupTOTPUC:               p.SetupTOTPUC,
		ConfirmTOTPUC:             p.ConfirmTOTPUC,
		BeginPasskeyRegUC:         p.BeginPasskeyRegUC,
		FinishPasskeyRegUC:        p.FinishPasskeyRegUC,
		BeginPasskeyAuthUC:        p.BeginPasskeyAuthUC,
		FinishPasskeyAuthUC:       p.FinishPasskeyAuthUC,
		VerifyTOTPLoginUC:         p.VerifyTOTPLoginUC,
		FinishPasskeyLoginUC:      p.FinishPasskeyLoginUC,
		MFASigner:                 p.MFASigner,
		ChangePasswordUC:          p.ChangePasswordUC,
		AccessSigner:              p.AccessSigner,
		GetTenantUC:               p.GetTenantUC,
		PreviewInvitationUC:       p.PreviewInvitationUC,
		GetEnrollmentQRUC:         p.GetEnrollmentQRUC,
		ListNearbyLocationsUC:     p.ListNearbyLocationsUC,
		SetLocationHQUC:           p.SetLocationHQUC,
		QueryTenantMetricsUC:      p.QueryTenantMetricsUC,
		StripeWebhookSecret:       cfg.StripeWebhookSecret,
		CORSAllowAll:              cfg.CORSAllowAll,
		AssetUploadDir:            cfg.AssetUploadDir,
		UploadTenantLogoUC:        p.UploadTenantLogoUC,
		UpdateCustomerProfileUC:   p.UpdateCustomerProfileUC,
		ListTiersUC:               p.ListTiersUC,
		UpsertTierUC:              p.UpsertTierUC,
		SeedDefaultTiersUC:        p.SeedDefaultTiersUC,
		ValidateStoreRulesUC:      p.ValidateStoreRulesUC,
		GetQRBrandingUC:           p.GetQRBrandingUC,
		PutQRBrandingUC:           p.PutQRBrandingUC,
		GetTenantLocalesUC:        p.GetTenantLocalesUC,
		PutTenantLocalesUC:        p.PutTenantLocalesUC,
		ListCampaignsUC:           p.ListCampaignsUC,
		GetCampaignUC:             p.GetCampaignUC,
		CreateCampaignUC:          p.CreateCampaignUC,
		UpdateCampaignUC:          p.UpdateCampaignUC,
		LaunchCampaignUC:          p.LaunchCampaignUC,
		PauseCampaignUC:           p.PauseCampaignUC,
		GetTenantCustomerUC:       p.GetTenantCustomerUC,
		AdjustCustomerPointsUC:    p.AdjustCustomerPointsUC,
		TenantAnalyticsOverviewUC: p.TenantAnalyticsOverviewUC,
		MemberGrowthUC:            p.MemberGrowthUC,
		TierDistributionUC:        p.TierDistributionUC,
		HourlyHeatmapUC:           p.HourlyHeatmapUC,
		TopRewardsUC:              p.TopRewardsUC,
		RetentionCohortsUC:        p.RetentionCohortsUC,
		UploadRewardImageUC:       p.UploadRewardImageUC,
	}
}

func ProvideRouter(signer *authtoken.JWTSigner, srv *httpserver.Server) *gin.Engine {
	return httpserver.NewRouter(signer, srv)
}

func ProvideNetHTTPServer(cfg config.Config, engine *gin.Engine) *http.Server {
	return &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}
