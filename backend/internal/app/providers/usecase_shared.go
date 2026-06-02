package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
)

func ProvideProvisionOrganization(
	stores ports.StoreRepository,
	subscriptions ports.SubscriptionRepository,
	clock ports.Clock,
) *usecase.ProvisionOrganization {
	return &usecase.ProvisionOrganization{
		Stores:        stores,
		Subscriptions: subscriptions,
		Clock:         clock,
	}
}

func ProvideQuotaChecker(
	plans ports.PlanCatalogRepository,
	subscriptions ports.SubscriptionRepository,
	stores ports.StoreRepository,
	storeMembers ports.StoreMembershipRepository,
	enrollments ports.LoyaltyEnrollmentRepository,
) *usecase.QuotaChecker {
	return &usecase.QuotaChecker{
		Plans:         plans,
		Subscriptions: subscriptions,
		Stores:        stores,
		StoreMembers:  storeMembers,
		Enrollments:   enrollments,
	}
}

func ProvideUploadTenantLogo(storage ports.ObjectStorage) *usecase.UploadTenantLogo {
	if storage == nil {
		return nil
	}
	return &usecase.UploadTenantLogo{Storage: storage, MaxBytes: 2 << 20}
}

func ProvideListStoreCustomers(catalog *postgres.StoreCatalog) *usecase.ListStoreCustomers {
	return &usecase.ListStoreCustomers{Catalog: catalog}
}

func ProvideListStorePointEvents(catalog *postgres.StoreCatalog) *usecase.ListStorePointEvents {
	return &usecase.ListStorePointEvents{Catalog: catalog}
}
