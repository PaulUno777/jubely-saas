package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PlanCatalogRepository struct {
	Pool *pgxpool.Pool
}

func (r *PlanCatalogRepository) FindByCode(ctx context.Context, code string) (*domain.PlanCatalog, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT code, name, max_stores, max_agents, max_active_customers, price_monthly_fcfa, price_yearly_fcfa, features, active
FROM plan_catalog WHERE code=$1`
	var p domain.PlanCatalog
	err := db.QueryRow(ctx, q, code).Scan(
		&p.Code, &p.Name, &p.MaxStores, &p.MaxAgents, &p.MaxActiveCustomers,
		&p.PriceMonthlyFCFA, &p.PriceYearlyFCFA, &p.Features, &p.Active,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PlanCatalogRepository) ListActive(ctx context.Context) ([]domain.PlanCatalog, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT code, name, max_stores, max_agents, max_active_customers, price_monthly_fcfa, price_yearly_fcfa, features, active
FROM plan_catalog WHERE active=true ORDER BY price_monthly_fcfa ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.PlanCatalog
	for rows.Next() {
		var p domain.PlanCatalog
		if err := rows.Scan(
			&p.Code, &p.Name, &p.MaxStores, &p.MaxAgents, &p.MaxActiveCustomers,
			&p.PriceMonthlyFCFA, &p.PriceYearlyFCFA, &p.Features, &p.Active,
		); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

type SubscriptionRepository struct {
	Pool *pgxpool.Pool
}

func (r *SubscriptionRepository) Create(ctx context.Context, sub *domain.Subscription) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO subscriptions (
    id, tenant_id, plan_code, status, billing_period, trial_ends_at,
    current_period_start, current_period_end, cancel_at_period_end, paused_at,
    payment_method_preference, stripe_customer_id, stripe_subscription_id, created_at, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`
	_, err := db.Exec(ctx, q,
		sub.ID, sub.TenantID, sub.PlanCode, string(sub.Status), sub.BillingPeriod,
		sub.TrialEndsAt, sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.CancelAtPeriodEnd, sub.PausedAt,
		sub.PaymentMethodPref, sub.StripeCustomerID, sub.StripeSubscriptionID, sub.CreatedAt, sub.UpdatedAt,
	)
	return err
}

func (r *SubscriptionRepository) Update(ctx context.Context, sub *domain.Subscription) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE subscriptions SET plan_code=$2, status=$3, billing_period=$4, trial_ends_at=$5,
    current_period_start=$6, current_period_end=$7, cancel_at_period_end=$8, paused_at=$9,
    payment_method_preference=$10, stripe_customer_id=$11, stripe_subscription_id=$12, updated_at=$13
WHERE id=$1`
	res, err := db.Exec(ctx, q,
		sub.ID, sub.PlanCode, string(sub.Status), sub.BillingPeriod, sub.TrialEndsAt,
		sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.CancelAtPeriodEnd, sub.PausedAt,
		sub.PaymentMethodPref, sub.StripeCustomerID, sub.StripeSubscriptionID, sub.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *SubscriptionRepository) FindByOrganization(ctx context.Context, organizationID uuid.UUID) (*domain.Subscription, error) {
	db := pickDB(ctx, r.Pool)
	return scanSubscription(db.QueryRow(ctx, `
SELECT id, tenant_id, plan_code, status, billing_period, trial_ends_at,
    current_period_start, current_period_end, cancel_at_period_end, paused_at,
    payment_method_preference, stripe_customer_id, stripe_subscription_id, created_at, updated_at
FROM subscriptions WHERE tenant_id=$1`, organizationID))
}

func (r *SubscriptionRepository) FindByStripeSubscriptionID(ctx context.Context, stripeSubID string) (*domain.Subscription, error) {
	db := pickDB(ctx, r.Pool)
	return scanSubscription(db.QueryRow(ctx, `
SELECT id, tenant_id, plan_code, status, billing_period, trial_ends_at,
    current_period_start, current_period_end, cancel_at_period_end, paused_at,
    payment_method_preference, stripe_customer_id, stripe_subscription_id, created_at, updated_at
FROM subscriptions WHERE stripe_subscription_id=$1`, stripeSubID))
}

func scanSubscription(row pgx.Row) (*domain.Subscription, error) {
	var sub domain.Subscription
	var status string
	err := row.Scan(
		&sub.ID, &sub.TenantID, &sub.PlanCode, &status, &sub.BillingPeriod, &sub.TrialEndsAt,
		&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CancelAtPeriodEnd, &sub.PausedAt,
		&sub.PaymentMethodPref, &sub.StripeCustomerID, &sub.StripeSubscriptionID, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	sub.Status = domain.SubscriptionStatus(status)
	return &sub, nil
}

type SubscriptionInvoiceRepository struct {
	Pool *pgxpool.Pool
}

func (r *SubscriptionInvoiceRepository) Create(ctx context.Context, inv *domain.SubscriptionInvoice) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO subscription_invoices (
    id, subscription_id, tenant_id, amount_fcfa, currency, provider, pay_reference,
    status, period_start, period_end, expires_at, paid_at, created_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`
	_, err := db.Exec(ctx, q,
		inv.ID, inv.SubscriptionID, inv.TenantID, inv.AmountFCFA, inv.Currency, inv.Provider,
		inv.PayReference, inv.Status, inv.PeriodStart, inv.PeriodEnd, inv.ExpiresAt, inv.PaidAt, inv.CreatedAt,
	)
	return err
}

func (r *SubscriptionInvoiceRepository) FindByPayReference(ctx context.Context, payReference string) (*domain.SubscriptionInvoice, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, subscription_id, tenant_id, amount_fcfa, currency, provider, pay_reference,
    status, period_start, period_end, expires_at, paid_at, created_at
FROM subscription_invoices WHERE pay_reference=$1`
	var inv domain.SubscriptionInvoice
	err := db.QueryRow(ctx, q, payReference).Scan(
		&inv.ID, &inv.SubscriptionID, &inv.TenantID, &inv.AmountFCFA, &inv.Currency, &inv.Provider,
		&inv.PayReference, &inv.Status, &inv.PeriodStart, &inv.PeriodEnd, &inv.ExpiresAt, &inv.PaidAt, &inv.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *SubscriptionInvoiceRepository) MarkPaid(ctx context.Context, invoiceID uuid.UUID, paidAt time.Time) error {
	db := pickDB(ctx, r.Pool)
	res, err := db.Exec(ctx, `
UPDATE subscription_invoices SET status='paid', paid_at=$2 WHERE id=$1 AND status='pending'`, invoiceID, paidAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrConflict
	}
	return nil
}

func (r *SubscriptionInvoiceRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, limit int) ([]domain.SubscriptionInvoice, error) {
	if limit <= 0 {
		limit = 20
	}
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT id, subscription_id, tenant_id, amount_fcfa, currency, provider, pay_reference,
    status, period_start, period_end, expires_at, paid_at, created_at
FROM subscription_invoices WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2`, organizationID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.SubscriptionInvoice
	for rows.Next() {
		var inv domain.SubscriptionInvoice
		if err := rows.Scan(
			&inv.ID, &inv.SubscriptionID, &inv.TenantID, &inv.AmountFCFA, &inv.Currency, &inv.Provider,
			&inv.PayReference, &inv.Status, &inv.PeriodStart, &inv.PeriodEnd, &inv.ExpiresAt, &inv.PaidAt, &inv.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, inv)
	}
	return out, rows.Err()
}
