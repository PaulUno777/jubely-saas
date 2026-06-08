package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
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
) *loyalty.CreateCustomerByStaff {
	return &loyalty.CreateCustomerByStaff{
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
) *loyalty.GetCustomerWallet {
	return &loyalty.GetCustomerWallet{
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
) *loyalty.EnrollByStoreQR {
	return &loyalty.EnrollByStoreQR{
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

func ProvideListStoreRewards(rewards ports.RewardRepository) *loyalty.ListStoreRewards {
	return &loyalty.ListStoreRewards{Rewards: rewards}
}

func ProvideCreateStoreReward(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	clock ports.Clock,
) *loyalty.CreateStoreReward {
	return &loyalty.CreateStoreReward{Rewards: rewards, RewardStores: rewardStores, Clock: clock}
}

func ProvidePatchStoreReward(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	clock ports.Clock,
) *loyalty.PatchStoreReward {
	return &loyalty.PatchStoreReward{Rewards: rewards, RewardStores: rewardStores, Clock: clock}
}

func ProvideListCustomerRewards(
	rewards ports.RewardRepository,
	rewardStores ports.RewardStoreAvailabilityRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
	catalog *postgres.StoreCatalog,
) *loyalty.ListCustomerRewards {
	return &loyalty.ListCustomerRewards{
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
) *loyalty.CustomerClaimReward {
	return &loyalty.CustomerClaimReward{
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
) *staff.StaffValidateRedemption {
	return &staff.StaffValidateRedemption{
		QRCodec:     qrCodec,
		Redemptions: redemptions,
		Rewards:     rewards,
		Enrollments: enrollments,
		Customers:   customers,
		Clock:       clock,
	}
}

func ProvideListStoreRules(rules ports.PointsRuleRepository) *loyalty.ListStoreRules {
	return &loyalty.ListStoreRules{Rules: rules}
}

func ProvideCreateStoreRule(rules ports.PointsRuleRepository) *loyalty.CreateStoreRule {
	return &loyalty.CreateStoreRule{Rules: rules}
}

func ProvidePatchStoreRule(rules ports.PointsRuleRepository) *loyalty.PatchStoreRule {
	return &loyalty.PatchStoreRule{Rules: rules}
}

func ProvideSimulateStoreRules(rules ports.PointsRuleRepository) *loyalty.SimulateStoreRules {
	return &loyalty.SimulateStoreRules{Rules: rules}
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
) *staff.StaffRecordPurchase {
	return &staff.StaffRecordPurchase{
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
