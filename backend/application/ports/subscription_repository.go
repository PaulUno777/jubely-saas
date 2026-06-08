package ports

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type PlanCatalogRepository interface {
	FindByCode(ctx context.Context, code string) (*domain.PlanCatalog, error)
	ListActive(ctx context.Context) ([]domain.PlanCatalog, error)
}

type SubscriptionRepository interface {
	Create(ctx context.Context, sub *domain.Subscription) error
	Update(ctx context.Context, sub *domain.Subscription) error
	FindByOrganization(ctx context.Context, organizationID uuid.UUID) (*domain.Subscription, error)
	FindByStripeSubscriptionID(ctx context.Context, stripeSubID string) (*domain.Subscription, error)
}

type SubscriptionInvoiceRepository interface {
	Create(ctx context.Context, inv *domain.SubscriptionInvoice) error
	FindByPayReference(ctx context.Context, payReference string) (*domain.SubscriptionInvoice, error)
	MarkPaid(ctx context.Context, invoiceID uuid.UUID, paidAt time.Time) error
	ListByOrganization(ctx context.Context, organizationID uuid.UUID, limit int) ([]domain.SubscriptionInvoice, error)
}
