-- +goose Up
-- Rewards catalog, redemptions, subscription billing (plan catalog + MoMo references).

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    point_cost INT NOT NULL CHECK (point_cost > 0),
    min_tier TEXT NOT NULL DEFAULT 'bronze',
    active BOOLEAN NOT NULL DEFAULT true,
    stock_limit INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_tenant_active ON rewards(tenant_id, active);

CREATE TABLE IF NOT EXISTS reward_location_availability (
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (reward_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_location_availability_location ON reward_location_availability(location_id);

CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES loyalty_enrollments(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
    points_spent INT NOT NULL CHECK (points_spent > 0),
    status TEXT NOT NULL DEFAULT 'pending',
    claim_qr TEXT NOT NULL,
    display_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    burned_at TIMESTAMPTZ,
    fulfillment_stores JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_redemptions_claim_qr ON redemptions(claim_qr);
CREATE INDEX IF NOT EXISTS idx_redemptions_enrollment ON redemptions(enrollment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS plan_catalog (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_stores INT NOT NULL,
    max_agents INT NOT NULL,
    max_active_customers INT NOT NULL,
    price_monthly_fcfa INT NOT NULL,
    price_yearly_fcfa INT NOT NULL,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plan_catalog (code, name, max_stores, max_agents, max_active_customers, price_monthly_fcfa, price_yearly_fcfa, features)
VALUES
    ('starter', 'Standard', 1, 2, 500, 7500, 76500, '{"trial_days":0}'::jsonb),
    ('growth', 'Growth', 3, 5, 5000, 15000, 153000, '{"trial_days":30,"trial_max_stores":1}'::jsonb),
    ('business', 'Scale', 999, 999, 100000, 38000, 387600, '{}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    max_stores = EXCLUDED.max_stores,
    max_agents = EXCLUDED.max_agents,
    max_active_customers = EXCLUDED.max_active_customers,
    price_monthly_fcfa = EXCLUDED.price_monthly_fcfa,
    price_yearly_fcfa = EXCLUDED.price_yearly_fcfa,
    features = EXCLUDED.features;

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL REFERENCES plan_catalog(code),
    status TEXT NOT NULL DEFAULT 'trialing',
    billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    paused_at TIMESTAMPTZ,
    payment_method_preference TEXT NOT NULL DEFAULT 'momo' CHECK (payment_method_preference IN ('stripe', 'momo')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT subscriptions_status_chk CHECK (
        status IN ('trialing', 'active', 'past_due', 'paused', 'frozen', 'canceled')
    )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount_fcfa INT NOT NULL CHECK (amount_fcfa > 0),
    currency TEXT NOT NULL DEFAULT 'XAF',
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'momo')),
    pay_reference TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'canceled')),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_tenant ON subscription_invoices(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS payment_attempts;
DROP TABLE IF EXISTS subscription_invoices;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plan_catalog;
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS reward_location_availability;
DROP TABLE IF EXISTS rewards;
