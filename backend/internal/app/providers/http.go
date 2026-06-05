package providers

import (
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
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
	BootstrapUC             *usecase.BootstrapSuperadmin
	LoginUC                   *usecase.Login
	SelectWorkspaceUC         *usecase.SelectWorkspace
	RefreshUC                 *usecase.RefreshAuth
	LogoutUC                  *usecase.Logout
	StoreSignupUC             *usecase.StoreSignup
	CreateTenantUC            *usecase.CreateTenant
	ListTenantsUC             *usecase.ListTenants
	UpdateTenantUC            *usecase.UpdateTenant
	ListTenantUsersUC         *usecase.ListTenantUsers
	CreateInvitationUC        *usecase.CreateMerchantInvitation
	AcceptInvitationUC        *usecase.AcceptMerchantInvitation
	CreateTenantUserUC        *usecase.CreateTenantUser
	SuperadminStatsUC         *usecase.SuperadminStats
	CreateCustomerUC          *usecase.CreateCustomerByStaff
	EnrollByStoreQRUC         *usecase.EnrollByStoreQR
	GetCustomerWalletUC       *usecase.GetCustomerWallet
	CustomerLoginUC           *usecase.CustomerLogin
	SelectCustomerContextUC   *usecase.SelectCustomerContext
	StaffRecordPurchaseUC     *usecase.StaffRecordPurchase
	StaffValidateRedemptionUC *usecase.StaffValidateRedemption
	ListStoreRewardsUC        *usecase.ListStoreRewards
	CreateStoreRewardUC       *usecase.CreateStoreReward
	PatchStoreRewardUC        *usecase.PatchStoreReward
	ListCustomerRewardsUC     *usecase.ListCustomerRewards
	CustomerClaimRewardUC     *usecase.CustomerClaimReward
	ListStoreRulesUC          *usecase.ListStoreRules
	CreateStoreRuleUC         *usecase.CreateStoreRule
	PatchStoreRuleUC          *usecase.PatchStoreRule
	SimulateStoreRulesUC      *usecase.SimulateStoreRules
	ListStoreCustomersUC      *usecase.ListStoreCustomers
	ListStorePointEventsUC    *usecase.ListStorePointEvents
	ListOrgStoresUC           *usecase.ListOrgStores
	CreateOrgStoreUC          *usecase.CreateOrgStore
	GetOrgSubscriptionUC      *usecase.GetOrgSubscription
	CreateMoMoInvoiceUC       *usecase.CreateMoMoInvoice
	ConfirmMoMoInvoiceUC      *usecase.ConfirmMoMoInvoice
	ListPlansUC               *usecase.ListPlans
	PublicCustomerOTP         *usecase.PublicCustomerOTP
	SetupTOTPUC               *usecase.SetupTOTP
	ConfirmTOTPUC             *usecase.ConfirmTOTP
	BeginPasskeyRegUC         *usecase.BeginPasskeyRegistration
	FinishPasskeyRegUC        *usecase.FinishPasskeyRegistration
	BeginPasskeyAuthUC        *usecase.BeginPasskeyAuthentication
	FinishPasskeyAuthUC       *usecase.FinishPasskeyAuthentication
	VerifyTOTPLoginUC         *usecase.VerifyLoginTOTP
	FinishPasskeyLoginUC      *usecase.FinishLoginPasskey
	MFASigner                 *authtoken.JWTSigner
	ChangePasswordUC          *usecase.ChangePassword
	QRCodec                   ports.QRCodec
	AccessSigner              ports.TokenSigner
	Tenants                   ports.TenantRepository
	Stores                    ports.StoreRepository
	Invitations               ports.InvitationRepository
	StoreMetrics              ports.TenantLoyaltyMetrics
	LocationDiscovery         ports.LocationDiscoveryRepository
	UploadTenantLogoUC        *usecase.UploadTenantLogo
	UpdateCustomerProfileUC   *usecase.UpdateCustomerProfile
	ListTiersUC               *usecase.ListTiers
	UpsertTierUC              *usecase.UpsertTier
	SeedDefaultTiersUC        *usecase.SeedDefaultTiers
	ValidateStoreRulesUC      *usecase.ValidateStoreRules
	GetQRBrandingUC           *usecase.GetQRBranding
	PutQRBrandingUC           *usecase.PutQRBranding
	GetTenantLocalesUC        *usecase.GetTenantLocales
	PutTenantLocalesUC        *usecase.PutTenantLocales
	ListCampaignsUC           *usecase.ListCampaigns
	GetCampaignUC             *usecase.GetCampaign
	CreateCampaignUC          *usecase.CreateCampaign
	UpdateCampaignUC          *usecase.UpdateCampaign
	LaunchCampaignUC          *usecase.LaunchCampaign
	PauseCampaignUC           *usecase.PauseCampaign
	GetTenantCustomerUC       *usecase.GetTenantCustomer
	AdjustCustomerPointsUC    *usecase.AdjustCustomerPoints
	TenantAnalyticsOverviewUC *usecase.TenantAnalyticsOverview
	MemberGrowthUC            *usecase.MemberGrowth
	TierDistributionUC        *usecase.TierDistribution
	HourlyHeatmapUC           *usecase.HourlyHeatmap
	TopRewardsUC              *usecase.TopRewards
	RetentionCohortsUC        *usecase.RetentionCohorts
	UploadRewardImageUC       *usecase.UploadRewardImage
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
		QRCodec:                   p.QRCodec,
		AccessSigner:              p.AccessSigner,
		Tenants:                   p.Tenants,
		Stores:                    p.Stores,
		Invitations:               p.Invitations,
		StoreMetrics:              p.StoreMetrics,
		LocationDiscovery:         p.LocationDiscovery,
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
