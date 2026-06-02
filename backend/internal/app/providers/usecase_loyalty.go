package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
)

func ProvideCreateCustomerByStaff(
	tx ports.TxManager,
	tenants ports.TenantRepository,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	qrCodec ports.QRCodec,
) *usecase.CreateCustomerByStaff {
	return &usecase.CreateCustomerByStaff{
		Tx:          tx,
		Tenants:     tenants,
		Users:       users,
		Memberships: memberships,
		Customers:   customers,
		Enrollments: enrollments,
		QRCodec:     qrCodec,
	}
}

func ProvideGetCustomerWallet(
	qrCodec ports.QRCodec,
	tenants ports.TenantRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	catalog *postgres.StoreCatalog,
) *usecase.GetCustomerWallet {
	return &usecase.GetCustomerWallet{
		QRCodec:     qrCodec,
		Tenants:     tenants,
		Enrollments: enrollments,
		Catalog:     catalog,
	}
}

func ProvideEnrollByStoreQR(
	tx ports.TxManager,
	clock ports.Clock,
	tenants ports.TenantRepository,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	stores ports.StoreRepository,
	subscriptions ports.SubscriptionRepository,
	qrCodec ports.QRCodec,
	phoneProof ports.PhoneEnrollmentProofParser,
	requirePhone bool,
) *usecase.EnrollByStoreQR {
	return &usecase.EnrollByStoreQR{
		Tx:                       tx,
		Clock:                    clock,
		Tenants:                  tenants,
		Users:                    users,
		Memberships:              memberships,
		Customers:                customers,
		Enrollments:              enrollments,
		Stores:                   stores,
		Subscriptions:            subscriptions,
		QRCodec:                  qrCodec,
		PhoneProofParser:         phoneProof,
		RequirePhoneVerification: requirePhone,
	}
}

func ProvideListStoreRewards(rewards ports.RewardRepository) *usecase.ListStoreRewards {
	return &usecase.ListStoreRewards{Rewards: rewards}
}

func ProvideCreateStoreReward(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	clock ports.Clock,
) *usecase.CreateStoreReward {
	return &usecase.CreateStoreReward{Rewards: rewards, RewardStores: rewardStores, Clock: clock}
}

func ProvidePatchStoreReward(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	clock ports.Clock,
) *usecase.PatchStoreReward {
	return &usecase.PatchStoreReward{Rewards: rewards, RewardStores: rewardStores, Clock: clock}
}

func ProvideListCustomerRewards(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	catalog *postgres.StoreCatalog,
) *usecase.ListCustomerRewards {
	return &usecase.ListCustomerRewards{
		Rewards:      rewards,
		RewardStores: rewardStores,
		Enrollments:  enrollments,
		Balances:     catalog,
	}
}

func ProvideCustomerClaimReward(
	tx ports.TxManager,
	qrCodec ports.QRCodec,
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	redemptions ports.RedemptionRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	catalog *postgres.StoreCatalog,
	points ports.PointEventWriter,
	clock ports.Clock,
) *usecase.CustomerClaimReward {
	return &usecase.CustomerClaimReward{
		Tx:           tx,
		QRCodec:      qrCodec,
		Rewards:      rewards,
		RewardStores: rewardStores,
		Redemptions:  redemptions,
		Enrollments:  enrollments,
		Balances:     catalog,
		Points:       points,
		Clock:        clock,
	}
}

func ProvideStaffValidateRedemption(
	qrCodec ports.QRCodec,
	redemptions ports.RedemptionRepository,
	rewards ports.RewardRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	customers ports.CustomerIdentityRepository,
	clock ports.Clock,
) *usecase.StaffValidateRedemption {
	return &usecase.StaffValidateRedemption{
		QRCodec:     qrCodec,
		Redemptions: redemptions,
		Rewards:     rewards,
		Enrollments: enrollments,
		Customers:   customers,
		Clock:       clock,
	}
}

func ProvideListStoreRules(rules ports.PointsRuleRepository) *usecase.ListStoreRules {
	return &usecase.ListStoreRules{Rules: rules}
}

func ProvideCreateStoreRule(rules ports.PointsRuleRepository) *usecase.CreateStoreRule {
	return &usecase.CreateStoreRule{Rules: rules}
}

func ProvidePatchStoreRule(rules ports.PointsRuleRepository) *usecase.PatchStoreRule {
	return &usecase.PatchStoreRule{Rules: rules}
}

func ProvideSimulateStoreRules(rules ports.PointsRuleRepository) *usecase.SimulateStoreRules {
	return &usecase.SimulateStoreRules{Rules: rules}
}

func ProvideStaffRecordPurchase(
	qrCodec ports.QRCodec,
	tenants ports.TenantRepository,
	customers ports.CustomerIdentityRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	points ports.PointEventWriter,
	catalog *postgres.StoreCatalog,
	rules ports.PointsRuleRepository,
	clock ports.Clock,
) *usecase.StaffRecordPurchase {
	return &usecase.StaffRecordPurchase{
		QRCodec:     qrCodec,
		Tenants:     tenants,
		Customers:   customers,
		Enrollments: enrollments,
		Points:      points,
		Balances:    catalog,
		Rules:       rules,
		Clock:       clock,
	}
}
