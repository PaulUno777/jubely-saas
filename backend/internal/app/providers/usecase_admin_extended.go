package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
)

func ProvideUpdateCustomerProfile(
	customers ports.CustomerIdentityRepository,
	clock ports.Clock,
) *usecase.UpdateCustomerProfile {
	return &usecase.UpdateCustomerProfile{Customers: customers, Clock: clock}
}

func ProvideListTiers(tiers ports.LoyaltyTierRepository) *usecase.ListTiers {
	return &usecase.ListTiers{Tiers: tiers}
}

func ProvideUpsertTier(tiers ports.LoyaltyTierRepository, clock ports.Clock) *usecase.UpsertTier {
	return &usecase.UpsertTier{Tiers: tiers, Clock: clock}
}

func ProvideSeedDefaultTiers(tiers ports.LoyaltyTierRepository, clock ports.Clock) *usecase.SeedDefaultTiers {
	return &usecase.SeedDefaultTiers{Tiers: tiers, Clock: clock}
}

func ProvideValidateStoreRules(
	rules ports.PointsRuleRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
) *usecase.ValidateStoreRules {
	return &usecase.ValidateStoreRules{Rules: rules, Subs: subs, Plans: plans}
}

func ProvideGetQRBranding(
	branding ports.QRBrandingRepository,
	strings ports.LocalizedStringRepository,
) *usecase.GetQRBranding {
	return &usecase.GetQRBranding{Branding: branding, Strings: strings}
}

func ProvidePutQRBranding(
	branding ports.QRBrandingRepository,
	strings ports.LocalizedStringRepository,
	clock ports.Clock,
) *usecase.PutQRBranding {
	return &usecase.PutQRBranding{Branding: branding, Strings: strings, Clock: clock}
}

func ProvideGetTenantLocales(locales ports.TenantSupportedLocaleRepository) *usecase.GetTenantLocales {
	return &usecase.GetTenantLocales{Locales: locales}
}

func ProvidePutTenantLocales(locales ports.TenantSupportedLocaleRepository) *usecase.PutTenantLocales {
	return &usecase.PutTenantLocales{Locales: locales}
}

func ProvideListCampaigns(campaigns ports.CampaignRepository) *usecase.ListCampaigns {
	return &usecase.ListCampaigns{Campaigns: campaigns}
}

func ProvideGetCampaign(campaigns ports.CampaignRepository) *usecase.GetCampaign {
	return &usecase.GetCampaign{Campaigns: campaigns}
}

func ProvideCreateCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *usecase.CreateCampaign {
	return &usecase.CreateCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideUpdateCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *usecase.UpdateCampaign {
	return &usecase.UpdateCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideLaunchCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *usecase.LaunchCampaign {
	return &usecase.LaunchCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvidePauseCampaign(
	campaigns ports.CampaignRepository,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	clock ports.Clock,
) *usecase.PauseCampaign {
	return &usecase.PauseCampaign{Campaigns: campaigns, Subs: subs, Plans: plans, Clock: clock}
}

func ProvideGetTenantCustomer(
	enrollments ports.LoyaltyEnrollmentRepository,
	customers ports.CustomerIdentityRepository,
	balances ports.EnrollmentBalanceReader,
	tiers ports.LoyaltyTierRepository,
) *usecase.GetTenantCustomer {
	return &usecase.GetTenantCustomer{
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
) *usecase.RecalculateEnrollmentTier {
	return &usecase.RecalculateEnrollmentTier{
		Tiers:       tiers,
		Enrollments: enrollments,
		Balances:    balances,
	}
}

func ProvideAdjustCustomerPoints(
	enrollments ports.LoyaltyEnrollmentRepository,
	points ports.PointEventWriter,
	balances ports.EnrollmentBalanceReader,
	recalc *usecase.RecalculateEnrollmentTier,
) *usecase.AdjustCustomerPoints {
	return &usecase.AdjustCustomerPoints{
		Enrollments: enrollments,
		Points:      points,
		Balances:    balances,
		Recalc:      recalc,
	}
}

func ProvideTenantAnalyticsOverview(analytics ports.TenantAnalyticsRepository) *usecase.TenantAnalyticsOverview {
	return &usecase.TenantAnalyticsOverview{Analytics: analytics}
}

func ProvideMemberGrowth(analytics ports.TenantAnalyticsRepository) *usecase.MemberGrowth {
	return &usecase.MemberGrowth{Analytics: analytics}
}

func ProvideTierDistribution(analytics ports.TenantAnalyticsRepository) *usecase.TierDistribution {
	return &usecase.TierDistribution{Analytics: analytics}
}

func ProvideHourlyHeatmap(analytics ports.TenantAnalyticsRepository) *usecase.HourlyHeatmap {
	return &usecase.HourlyHeatmap{Analytics: analytics}
}

func ProvideTopRewards(analytics ports.TenantAnalyticsRepository) *usecase.TopRewards {
	return &usecase.TopRewards{Analytics: analytics}
}

func ProvideRetentionCohorts(analytics ports.TenantAnalyticsRepository) *usecase.RetentionCohorts {
	return &usecase.RetentionCohorts{Analytics: analytics}
}

// ProvideEnrollmentBalanceReader binds StoreCatalog as the balance reader for admin extended flows.
func ProvideEnrollmentBalanceReader(catalog *postgres.StoreCatalog) ports.EnrollmentBalanceReader {
	return catalog
}

func ProvideUploadRewardImage(storage ports.ObjectStorage, rewards ports.RewardRepository, clock ports.Clock) *usecase.UploadRewardImage {
	return &usecase.UploadRewardImage{Storage: storage, Rewards: rewards, Clock: clock}
}
