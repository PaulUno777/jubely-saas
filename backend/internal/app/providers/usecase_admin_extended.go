package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/campaign"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
)

func ProvideUpdateCustomerProfile(
	customers ports.CustomerIdentityRepository,
	clock ports.Clock,
) *loyalty.UpdateCustomerProfile {
	return &loyalty.UpdateCustomerProfile{Customers: customers, Clock: clock}
}

func ProvideListTiers(tiers ports.LoyaltyTierRepository) *loyalty.ListTiers {
	return &loyalty.ListTiers{Tiers: tiers}
}

func ProvideUpsertTier(tiers ports.LoyaltyTierRepository, clock ports.Clock) *loyalty.UpsertTier {
	return &loyalty.UpsertTier{Tiers: tiers, Clock: clock}
}

func ProvideSeedDefaultTiers(tiers ports.LoyaltyTierRepository, clock ports.Clock) *loyalty.SeedDefaultTiers {
	return &loyalty.SeedDefaultTiers{Tiers: tiers, Clock: clock}
}

func ProvideValidateStoreRules(
	rules ports.PointsRuleRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
) *loyalty.ValidateStoreRules {
	return &loyalty.ValidateStoreRules{Rules: rules, Subs: subs, Plans: plans}
}

func ProvideGetQRBranding(
	branding ports.QRBrandingRepository,
	strings ports.LocalizedStringRepository,
) *tenant.GetQRBranding {
	return &tenant.GetQRBranding{Branding: branding, Strings: strings}
}

func ProvidePutQRBranding(
	branding ports.QRBrandingRepository,
	strings ports.LocalizedStringRepository,
	clock ports.Clock,
) *tenant.PutQRBranding {
	return &tenant.PutQRBranding{Branding: branding, Strings: strings, Clock: clock}
}

func ProvideGetTenantLocales(locales ports.TenantSupportedLocaleRepository) *tenant.GetTenantLocales {
	return &tenant.GetTenantLocales{Locales: locales}
}

func ProvidePutTenantLocales(locales ports.TenantSupportedLocaleRepository) *tenant.PutTenantLocales {
	return &tenant.PutTenantLocales{Locales: locales}
}

func ProvideListCampaigns(campaigns ports.CampaignRepository) *campaign.ListCampaigns {
	return &campaign.ListCampaigns{Campaigns: campaigns}
}

func ProvideGetCampaign(campaigns ports.CampaignRepository) *campaign.GetCampaign {
	return &campaign.GetCampaign{Campaigns: campaigns}
}

func ProvideCreateCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *campaign.CreateCampaign {
	return &campaign.CreateCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideUpdateCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *campaign.UpdateCampaign {
	return &campaign.UpdateCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideLaunchCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *campaign.LaunchCampaign {
	return &campaign.LaunchCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvidePauseCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *campaign.PauseCampaign {
	return &campaign.PauseCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideGetTenantCustomer(
	enrollments ports.LoyaltyEnrollmentRepository,
	customers ports.CustomerIdentityRepository,
	balances ports.EnrollmentBalanceReader,
	tiers ports.LoyaltyTierRepository,
) *loyalty.GetTenantCustomer {
	return &loyalty.GetTenantCustomer{
		Enrollments: enrollments,
		Customers:   customers,
		Balances:    balances,
		Tiers:       tiers,
	}
}

func ProvideRecalculateEnrollmentTier(
	tiers ports.LoyaltyTierRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	balances ports.EnrollmentBalanceReader,
) *loyalty.RecalculateEnrollmentTier {
	return &loyalty.RecalculateEnrollmentTier{
		Tiers:       tiers,
		Enrollments: enrollments,
		Balances:    balances,
	}
}

func ProvideAdjustCustomerPoints(
	enrollments ports.LoyaltyEnrollmentRepository,
	points ports.PointEventWriter,
	balances ports.EnrollmentBalanceReader,
	recalc *loyalty.RecalculateEnrollmentTier,
) *loyalty.AdjustCustomerPoints {
	return &loyalty.AdjustCustomerPoints{
		Enrollments: enrollments,
		Points:      points,
		Balances:    balances,
		Recalc:      recalc,
	}
}

func ProvideTenantAnalyticsOverview(analyticsRepo ports.TenantAnalyticsRepository) *analytics.TenantAnalyticsOverview {
	return &analytics.TenantAnalyticsOverview{Analytics: analyticsRepo}
}

func ProvideMemberGrowth(analyticsRepo ports.TenantAnalyticsRepository) *analytics.MemberGrowth {
	return &analytics.MemberGrowth{Analytics: analyticsRepo}
}

func ProvideTierDistribution(analyticsRepo ports.TenantAnalyticsRepository) *analytics.TierDistribution {
	return &analytics.TierDistribution{Analytics: analyticsRepo}
}

func ProvideHourlyHeatmap(analyticsRepo ports.TenantAnalyticsRepository) *analytics.HourlyHeatmap {
	return &analytics.HourlyHeatmap{Analytics: analyticsRepo}
}

func ProvideTopRewards(analyticsRepo ports.TenantAnalyticsRepository) *analytics.TopRewards {
	return &analytics.TopRewards{Analytics: analyticsRepo}
}

func ProvideRetentionCohorts(analyticsRepo ports.TenantAnalyticsRepository) *analytics.RetentionCohorts {
	return &analytics.RetentionCohorts{Analytics: analyticsRepo}
}

// ProvideEnrollmentBalanceReader binds StoreCatalog as the balance reader for admin extended flows.
func ProvideEnrollmentBalanceReader(catalog *postgres.StoreCatalog) ports.EnrollmentBalanceReader {
	return catalog
}

func ProvideUploadRewardImage(storage ports.ObjectStorage, rewards ports.RewardRepository, clock ports.Clock) *loyalty.UploadRewardImage {
	return &loyalty.UploadRewardImage{Storage: storage, Rewards: rewards, Clock: clock}
}
