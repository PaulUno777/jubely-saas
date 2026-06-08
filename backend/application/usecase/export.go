// Package usecase re-exports bounded-context use cases for Wire and HTTP handlers.
package usecase

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/campaign"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
)

// Auth
type (
	BootstrapSuperadmin            = auth.BootstrapSuperadmin
	BootstrapSuperadminInput       = auth.BootstrapSuperadminInput
	Login                          = auth.Login
	LoginInput                     = auth.LoginInput
	LoginOutput                    = auth.LoginOutput
	SelectWorkspace                = auth.SelectWorkspace
	SelectWorkspaceInput           = auth.SelectWorkspaceInput
	SelectWorkspaceOutput          = auth.SelectWorkspaceOutput
	RefreshAuth                    = auth.RefreshAuth
	RefreshAuthInput               = auth.RefreshAuthInput
	RefreshAuthOutput              = auth.RefreshAuthOutput
	Logout                         = auth.Logout
	LogoutInput                    = auth.LogoutInput
	PublicCustomerOTP              = auth.PublicCustomerOTP
	PublicCustomerOTPSendInput     = auth.PublicCustomerOTPSendInput
	PublicCustomerOTPSendOutput    = auth.PublicCustomerOTPSendOutput
	PublicCustomerOTPVerifyInput   = auth.PublicCustomerOTPVerifyInput
	PublicCustomerOTPVerifyOutput  = auth.PublicCustomerOTPVerifyOutput
	SetupTOTP                      = auth.SetupTOTP
	SetupTOTPInput                 = auth.SetupTOTPInput
	SetupTOTPOutput                = auth.SetupTOTPOutput
	ConfirmTOTP                    = auth.ConfirmTOTP
	ConfirmTOTPInput               = auth.ConfirmTOTPInput
	BeginPasskeyRegistration       = auth.BeginPasskeyRegistration
	BeginPasskeyRegistrationInput  = auth.BeginPasskeyRegistrationInput
	BeginPasskeyRegistrationOutput = auth.BeginPasskeyRegistrationOutput
	FinishPasskeyRegistration      = auth.FinishPasskeyRegistration
	FinishPasskeyRegistrationInput = auth.FinishPasskeyRegistrationInput
	BeginPasskeyAuthentication     = auth.BeginPasskeyAuthentication
	BeginPasskeyAuthenticationInput = auth.BeginPasskeyAuthenticationInput
	BeginPasskeyAuthenticationOutput = auth.BeginPasskeyAuthenticationOutput
	FinishPasskeyAuthentication    = auth.FinishPasskeyAuthentication
	FinishPasskeyAuthenticationInput = auth.FinishPasskeyAuthenticationInput
	FinishPasskeyAuthenticationOutput = auth.FinishPasskeyAuthenticationOutput
	VerifyLoginTOTP                = auth.VerifyLoginTOTP
	VerifyLoginTOTPInput           = auth.VerifyLoginTOTPInput
	VerifyLoginTOTPOutput          = auth.VerifyLoginTOTPOutput
	FinishLoginPasskey             = auth.FinishLoginPasskey
	FinishLoginPasskeyInput        = auth.FinishLoginPasskeyInput
	FinishLoginPasskeyOutput       = auth.FinishLoginPasskeyOutput
	ChangePassword                 = auth.ChangePassword
	ChangePasswordInput            = auth.ChangePasswordInput
	CustomerLogin                  = auth.CustomerLogin
	CustomerLoginInput             = auth.CustomerLoginInput
	CustomerLoginOutput            = auth.CustomerLoginOutput
	SelectCustomerContext          = auth.SelectCustomerContext
	SelectCustomerContextInput     = auth.SelectCustomerContextInput
	SelectCustomerContextOutput    = auth.SelectCustomerContextOutput
)

// Tenant
type (
	StoreSignup                    = tenant.StoreSignup
	StoreSignupInput               = tenant.StoreSignupInput
	StoreSignupOutput              = tenant.StoreSignupOutput
	CreateTenant                   = tenant.CreateTenant
	CreateTenantInput              = tenant.CreateTenantInput
	CreateTenantOutput             = tenant.CreateTenantOutput
	ListTenants                    = tenant.ListTenants
	ListTenantsInput               = tenant.ListTenantsInput
	ListTenantsOutput              = tenant.ListTenantsOutput
	UpdateTenant                   = tenant.UpdateTenant
	UpdateTenantInput              = tenant.UpdateTenantInput
	UpdateTenantOutput             = tenant.UpdateTenantOutput
	ListTenantUsers                = tenant.ListTenantUsers
	ListTenantUsersInput           = tenant.ListTenantUsersInput
	ListTenantUsersOutput          = tenant.ListTenantUsersOutput
	CreateMerchantInvitation       = tenant.CreateMerchantInvitation
	CreateMerchantInvitationInput  = tenant.CreateMerchantInvitationInput
	CreateMerchantInvitationOutput = tenant.CreateMerchantInvitationOutput
	AcceptMerchantInvitation       = tenant.AcceptMerchantInvitation
	AcceptMerchantInvitationInput  = tenant.AcceptMerchantInvitationInput
	AcceptMerchantInvitationOutput = tenant.AcceptMerchantInvitationOutput
	CreateTenantUser               = tenant.CreateTenantUser
	CreateTenantUserInput          = tenant.CreateTenantUserInput
	CreateTenantUserOutput         = tenant.CreateTenantUserOutput
	SuperadminStats                = tenant.SuperadminStats
	SuperadminStatsOutput          = tenant.SuperadminStatsOutput
	ListOrgStores                  = tenant.ListOrgStores
	CreateOrgStore                 = tenant.CreateOrgStore
	CreateOrgStoreInput            = tenant.CreateOrgStoreInput
	GetTenant                      = tenant.GetTenant
	GetTenantInput                 = tenant.GetTenantInput
	PreviewInvitation              = tenant.PreviewInvitation
	PreviewInvitationInput         = tenant.PreviewInvitationInput
	PreviewInvitationOutput        = tenant.PreviewInvitationOutput
	ListNearbyLocations            = tenant.ListNearbyLocations
	SetLocationHQ                  = tenant.SetLocationHQ
	SetLocationHQInput             = tenant.SetLocationHQInput
	UploadTenantLogo               = tenant.UploadTenantLogo
	UploadTenantLogoInput          = tenant.UploadTenantLogoInput
	UploadTenantLogoOutput         = tenant.UploadTenantLogoOutput
	GetQRBranding                  = tenant.GetQRBranding
	GetQRBrandingOutput            = tenant.GetQRBrandingOutput
	PutQRBranding                  = tenant.PutQRBranding
	PutQRBrandingInput             = tenant.PutQRBrandingInput
	GetTenantLocales               = tenant.GetTenantLocales
	PutTenantLocales               = tenant.PutTenantLocales
	PutTenantLocalesInput          = tenant.PutTenantLocalesInput
	TenantLocaleInput              = tenant.TenantLocaleInput
	ProvisionOrganization          = tenant.ProvisionOrganization
)

var ErrUploadNotConfigured = tenant.ErrUploadNotConfigured

// Billing
type (
	GetOrgSubscription      = billing.GetOrgSubscription
	GetOrgSubscriptionOutput = billing.GetOrgSubscriptionOutput
	CreateMoMoInvoice       = billing.CreateMoMoInvoice
	CreateMoMoInvoiceOutput = billing.CreateMoMoInvoiceOutput
	ConfirmMoMoInvoice      = billing.ConfirmMoMoInvoice
	ListPlans               = billing.ListPlans
	QuotaChecker            = billing.QuotaChecker
)

// Loyalty
type (
	EnrollByStoreQR              = loyalty.EnrollByStoreQR
	EnrollByStoreQRInput         = loyalty.EnrollByStoreQRInput
	EnrollByStoreQROutput        = loyalty.EnrollByStoreQROutput
	GetCustomerWallet            = loyalty.GetCustomerWallet
	GetCustomerWalletInput       = loyalty.GetCustomerWalletInput
	GetCustomerWalletOutput      = loyalty.GetCustomerWalletOutput
	CustomerWalletEventView      = loyalty.CustomerWalletEventView
	ListCustomerRewards          = loyalty.ListCustomerRewards
	CustomerRewardItem           = loyalty.CustomerRewardItem
	CustomerClaimReward          = loyalty.CustomerClaimReward
	CustomerClaimRewardInput     = loyalty.CustomerClaimRewardInput
	CustomerClaimRewardOutput    = loyalty.CustomerClaimRewardOutput
	ListStoreRewards             = loyalty.ListStoreRewards
	CreateStoreReward            = loyalty.CreateStoreReward
	CreateStoreRewardInput       = loyalty.CreateStoreRewardInput
	PatchStoreReward             = loyalty.PatchStoreReward
	PatchStoreRewardInput        = loyalty.PatchStoreRewardInput
	ListStoreRules               = loyalty.ListStoreRules
	CreateStoreRule              = loyalty.CreateStoreRule
	CreateStoreRuleInput         = loyalty.CreateStoreRuleInput
	PatchStoreRule               = loyalty.PatchStoreRule
	PatchStoreRuleInput          = loyalty.PatchStoreRuleInput
	SimulateStoreRules           = loyalty.SimulateStoreRules
	SimulateStoreRulesInput      = loyalty.SimulateStoreRulesInput
	ValidateStoreRules           = loyalty.ValidateStoreRules
	ValidateStoreRulesInput      = loyalty.ValidateStoreRulesInput
	ValidateStoreRulesOutput     = loyalty.ValidateStoreRulesOutput
	ListStoreCustomers           = loyalty.ListStoreCustomers
	ListStoreCustomersInput      = loyalty.ListStoreCustomersInput
	ListStoreCustomersOutput     = loyalty.ListStoreCustomersOutput
	StoreCustomerView            = loyalty.StoreCustomerView
	ListStorePointEvents         = loyalty.ListStorePointEvents
	ListStorePointEventsInput    = loyalty.ListStorePointEventsInput
	ListStorePointEventsOutput   = loyalty.ListStorePointEventsOutput
	StorePointEventView          = loyalty.StorePointEventView
	GetEnrollmentQR              = loyalty.GetEnrollmentQR
	GetEnrollmentQRInput         = loyalty.GetEnrollmentQRInput
	UpdateCustomerProfile        = loyalty.UpdateCustomerProfile
	UpdateCustomerProfileInput   = loyalty.UpdateCustomerProfileInput
	UpdateCustomerProfileOutput  = loyalty.UpdateCustomerProfileOutput
	ListTiers                    = loyalty.ListTiers
	UpsertTier                   = loyalty.UpsertTier
	UpsertTierInput              = loyalty.UpsertTierInput
	SeedDefaultTiers             = loyalty.SeedDefaultTiers
	GetTenantCustomer            = loyalty.GetTenantCustomer
	GetTenantCustomerInput       = loyalty.GetTenantCustomerInput
	TenantCustomerDetail         = loyalty.TenantCustomerDetail
	AdjustCustomerPoints         = loyalty.AdjustCustomerPoints
	AdjustCustomerPointsInput    = loyalty.AdjustCustomerPointsInput
	AdjustCustomerPointsOutput   = loyalty.AdjustCustomerPointsOutput
	UploadRewardImage            = loyalty.UploadRewardImage
	UploadRewardImageInput       = loyalty.UploadRewardImageInput
	UploadRewardImageOutput      = loyalty.UploadRewardImageOutput
	CreateCustomerByStaff        = loyalty.CreateCustomerByStaff
	CreateCustomerByStaffInput   = loyalty.CreateCustomerByStaffInput
	CreateCustomerByStaffOutput  = loyalty.CreateCustomerByStaffOutput
)

// Staff
type (
	StaffRecordPurchase          = staff.StaffRecordPurchase
	StaffRecordPurchaseInput     = staff.StaffRecordPurchaseInput
	StaffRecordPurchaseOutput    = staff.StaffRecordPurchaseOutput
	StaffValidateRedemption      = staff.StaffValidateRedemption
	StaffValidateRedemptionInput = staff.StaffValidateRedemptionInput
	StaffValidateRedemptionOutput = staff.StaffValidateRedemptionOutput
)

// Campaign
type (
	ListCampaigns         = campaign.ListCampaigns
	ListCampaignsInput    = campaign.ListCampaignsInput
	GetCampaign           = campaign.GetCampaign
	CreateCampaign        = campaign.CreateCampaign
	CampaignMutationInput = campaign.CampaignMutationInput
	UpdateCampaign        = campaign.UpdateCampaign
	UpdateCampaignInput   = campaign.UpdateCampaignInput
	LaunchCampaign        = campaign.LaunchCampaign
	PauseCampaign         = campaign.PauseCampaign
)

// Analytics
type (
	QueryTenantMetrics            = analytics.QueryTenantMetrics
	TenantAnalyticsOverview       = analytics.TenantAnalyticsOverview
	TenantAnalyticsOverviewInput  = analytics.TenantAnalyticsOverviewInput
	MemberGrowth                  = analytics.MemberGrowth
	MemberGrowthInput             = analytics.MemberGrowthInput
	TierDistribution              = analytics.TierDistribution
	TierDistributionInput         = analytics.TierDistributionInput
	HourlyHeatmap                 = analytics.HourlyHeatmap
	HourlyHeatmapInput            = analytics.HourlyHeatmapInput
	TopRewards                    = analytics.TopRewards
	TopRewardsInput               = analytics.TopRewardsInput
	RetentionCohorts              = analytics.RetentionCohorts
	RetentionCohortsInput         = analytics.RetentionCohortsInput
)
