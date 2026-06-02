package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
)

func ProvideListOrgStores(stores ports.StoreRepository) *usecase.ListOrgStores {
	return &usecase.ListOrgStores{Stores: stores}
}

func ProvideCreateOrgStore(
	stores ports.StoreRepository,
	quota *usecase.QuotaChecker,
	clock ports.Clock,
) *usecase.CreateOrgStore {
	return &usecase.CreateOrgStore{Stores: stores, Quota: quota, Clock: clock}
}

func ProvideGetOrgSubscription(
	subscriptions ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
) *usecase.GetOrgSubscription {
	return &usecase.GetOrgSubscription{Subscriptions: subscriptions, Plans: plans}
}

func ProvideCreateMoMoInvoice(
	subscriptions ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	invoices ports.SubscriptionInvoiceRepository,
	clock ports.Clock,
) *usecase.CreateMoMoInvoice {
	return &usecase.CreateMoMoInvoice{
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
) *usecase.ConfirmMoMoInvoice {
	return &usecase.ConfirmMoMoInvoice{
		Invoices:      invoices,
		Subscriptions: subscriptions,
		Clock:         clock,
	}
}

func ProvideListPlans(plans ports.PlanCatalogRepository) *usecase.ListPlans {
	return &usecase.ListPlans{Plans: plans}
}
