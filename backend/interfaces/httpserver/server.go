package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/gin-gonic/gin"
)

type Server struct {
	BootstrapUC           *usecase.BootstrapSuperadmin
	LoginUC               *usecase.Login
	SelectWorkspaceUC     *usecase.SelectWorkspace
	RefreshUC             *usecase.RefreshAuth
	LogoutUC              *usecase.Logout
	StoreSignupUC         *usecase.StoreSignup
	CreateTenantUC        *usecase.CreateTenant
	ListTenantsUC         *usecase.ListTenants
	UpdateTenantUC        *usecase.UpdateTenant
	ListTenantUsersUC     *usecase.ListTenantUsers
	CreateInvitationUC    *usecase.CreateMerchantInvitation
	AcceptInvitationUC    *usecase.AcceptMerchantInvitation
	CreateTenantUserUC    *usecase.CreateTenantUser
	SuperadminStatsUC     *usecase.SuperadminStats
	CreateCustomerUC      *usecase.CreateCustomerByStaff
	EnrollByStoreQRUC     *usecase.EnrollByStoreQR
	GetCustomerWalletUC   *usecase.GetCustomerWallet
	CustomerLoginUC       *usecase.CustomerLogin
	SelectCustomerContextUC *usecase.SelectCustomerContext
	StaffRecordPurchaseUC   *usecase.StaffRecordPurchase
	StaffValidateRedemptionUC *usecase.StaffValidateRedemption
	ListStoreRewardsUC      *usecase.ListStoreRewards
	CreateStoreRewardUC     *usecase.CreateStoreReward
	PatchStoreRewardUC      *usecase.PatchStoreReward
	ListCustomerRewardsUC   *usecase.ListCustomerRewards
	CustomerClaimRewardUC   *usecase.CustomerClaimReward
	ListStoreRulesUC        *usecase.ListStoreRules
	CreateStoreRuleUC       *usecase.CreateStoreRule
	PatchStoreRuleUC        *usecase.PatchStoreRule
	SimulateStoreRulesUC    *usecase.SimulateStoreRules
	ListStoreCustomersUC  *usecase.ListStoreCustomers
	ListStorePointEventsUC *usecase.ListStorePointEvents
	ListOrgStoresUC        *usecase.ListOrgStores
	CreateOrgStoreUC       *usecase.CreateOrgStore
	GetOrgSubscriptionUC   *usecase.GetOrgSubscription
	CreateMoMoInvoiceUC    *usecase.CreateMoMoInvoice
	ConfirmMoMoInvoiceUC   *usecase.ConfirmMoMoInvoice
	ListPlansUC            *usecase.ListPlans
	PublicCustomerOTP     *usecase.PublicCustomerOTP
	SetupTOTPUC           *usecase.SetupTOTP
	ConfirmTOTPUC         *usecase.ConfirmTOTP
	BeginPasskeyRegUC     *usecase.BeginPasskeyRegistration
	FinishPasskeyRegUC    *usecase.FinishPasskeyRegistration
	BeginPasskeyAuthUC    *usecase.BeginPasskeyAuthentication
	FinishPasskeyAuthUC   *usecase.FinishPasskeyAuthentication
	VerifyTOTPLoginUC     *usecase.VerifyLoginTOTP
	FinishPasskeyLoginUC  *usecase.FinishLoginPasskey
	MFASigner             *authtoken.JWTSigner
	ChangePasswordUC      *usecase.ChangePassword
	QRCodec               ports.QRCodec
	AccessSigner          ports.TokenSigner

	Tenants      ports.TenantRepository
	Stores       ports.StoreRepository
	Invitations  ports.InvitationRepository
	StoreMetrics ports.TenantLoyaltyMetrics
	LocationDiscovery ports.LocationDiscoveryRepository

	StripeWebhookSecret string

	// CORSAllowAll enables permissive CORS for local dev.
	CORSAllowAll bool

	// Local uploads: directory on disk; used when FILE_STORAGE_DRIVER=local (or default with ASSET_UPLOAD_DIR).
	AssetUploadDir string
	// UploadTenantLogoUC optional; nil when object storage is not configured.
	UploadTenantLogoUC *usecase.UploadTenantLogo
}

func (s *Server) Health(c *gin.Context) {
	respondOK(c, gin.H{"status": "ok"})
}

// Claims is a helper for handlers.
func Claims(c *gin.Context) (ports.TokenClaims, bool) {
	raw, ok := c.Get(ginKeyAuthClaims)
	if !ok {
		return ports.TokenClaims{}, false
	}
	claims, ok := raw.(ports.TokenClaims)
	return claims, ok
}
