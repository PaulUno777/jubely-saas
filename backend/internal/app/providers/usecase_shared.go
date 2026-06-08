package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
)

func ProvideProvisionOrganization(
	stores ports.StoreRepository,
	subscriptions ports.SubscriptionRepository,
	clock ports.Clock,
) *tenant.ProvisionOrganization {
	return &tenant.ProvisionOrganization{
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
) *billing.QuotaChecker {
	return &billing.QuotaChecker{
		Plans:         plans,
		Subscriptions: subscriptions,
		Stores:        stores,
		StoreMembers:  storeMembers,
		Enrollments:   enrollments,
	}
}

func ProvideUploadTenantLogo(storage ports.ObjectStorage) *tenant.UploadTenantLogo {
	if storage == nil {
		return nil
	}
	return &tenant.UploadTenantLogo{Storage: storage, MaxBytes: 2 << 20}
}

func ProvideListStoreCustomers(catalog *postgres.StoreCatalog) *loyalty.ListStoreCustomers {
	return &loyalty.ListStoreCustomers{Catalog: catalog}
}

func ProvideListStorePointEvents(catalog *postgres.StoreCatalog) *loyalty.ListStorePointEvents {
	return &loyalty.ListStorePointEvents{Catalog: catalog}
}

func ProvideGetTenant(tenants ports.TenantRepository) *tenant.GetTenant {
	return &tenant.GetTenant{Tenants: tenants}
}

func ProvidePreviewInvitation(inv ports.InvitationRepository, tenants ports.TenantRepository) *tenant.PreviewInvitation {
	return &tenant.PreviewInvitation{Invitations: inv, Tenants: tenants}
}

func ProvideGetEnrollmentQR(stores ports.StoreRepository, qr ports.QRCodec) *loyalty.GetEnrollmentQR {
	return &loyalty.GetEnrollmentQR{Stores: stores, QRCodec: qr}
}

func ProvideListNearbyLocations(discovery ports.LocationDiscoveryRepository) *tenant.ListNearbyLocations {
	return &tenant.ListNearbyLocations{Discovery: discovery}
}

func ProvideSetLocationHQ(stores ports.StoreRepository) *tenant.SetLocationHQ {
	return &tenant.SetLocationHQ{Stores: stores}
}

func ProvideQueryTenantMetrics(metrics ports.TenantLoyaltyMetrics) *analytics.QueryTenantMetrics {
	return &analytics.QueryTenantMetrics{Metrics: metrics}
}
