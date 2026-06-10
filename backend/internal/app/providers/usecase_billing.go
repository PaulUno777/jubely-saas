package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
)

func ProvideListOrgStores(stores ports.StoreRepository) *tenant.ListOrgStores {
	return &tenant.ListOrgStores{Stores: stores}
}

func ProvideCreateOrgStore(
	stores ports.StoreRepository,
	quota *billing.QuotaChecker,
	clock ports.Clock,
) *tenant.CreateOrgStore {
	return &tenant.CreateOrgStore{Stores: stores, Quota: quota, Clock: clock}
}

func ProvideGetOrgSubscription(
	subscriptions ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
) *billing.GetOrgSubscription {
	return &billing.GetOrgSubscription{Subscriptions: subscriptions, Plans: plans}
}

func ProvideCreateMoMoInvoice(
	subscriptions ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	invoices ports.SubscriptionInvoiceRepository,
	clock ports.Clock,
) *billing.CreateMoMoInvoice {
	return &billing.CreateMoMoInvoice{
		Subscriptions: subscriptions,
		Plans:         plans,
		Invoices:      invoices,
		Clock:         clock,
	}
}

func ProvideConfirmMoMoInvoice(
	invoices ports.SubscriptionInvoiceRepository,
	subscriptions ports.SubscriptionRepository,
	clock ports.Clock,
) *billing.ConfirmMoMoInvoice {
	return &billing.ConfirmMoMoInvoice{
		Invoices:      invoices,
		Subscriptions: subscriptions,
		Clock:         clock,
	}
}

func ProvideListPlans(plans ports.PlanCatalogRepository) *billing.ListPlans {
	return &billing.ListPlans{Plans: plans}
}

func ProvidePatchOrgSubscription(
	subscriptions ports.SubscriptionRepository,
	clock ports.Clock,
	freeze *loyalty.FreezeAdvancedRulesOnDowngrade,
) *billing.PatchOrgSubscription {
	return &billing.PatchOrgSubscription{
		Subscriptions: subscriptions,
		Clock:         clock,
		FreezeRules:   freeze,
	}
}
