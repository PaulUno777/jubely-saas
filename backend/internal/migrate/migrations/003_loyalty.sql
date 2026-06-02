-- +goose Up
-- Global customer identity, org-scoped enrollment, points ledger and rules.

CREATE TABLE IF NOT EXISTS customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_identities(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'bronze',
    home_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT loyalty_enrollments_tenant_customer_uk UNIQUE (tenant_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_enrollments_tenant ON loyalty_enrollments(tenant_id);

CREATE TABLE IF NOT EXISTS point_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES loyalty_enrollments(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    delta INT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_events_tenant_created ON point_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_events_store_created ON point_events(store_id, created_at DESC)
    WHERE store_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS points_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    rule_json JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_rules_tenant ON points_rules(tenant_id, priority ASC, created_at ASC);

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_active_enrollment_id_fk'
    ) THEN
        ALTER TABLE refresh_tokens
        ADD CONSTRAINT refresh_tokens_active_enrollment_id_fk
        FOREIGN KEY (active_enrollment_id) REFERENCES loyalty_enrollments(id) ON DELETE SET NULL;
    END IF;
END;
$$;
-- +goose StatementEnd

-- +goose Down
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_active_enrollment_id_fk;
DROP TABLE IF EXISTS points_rules;
DROP TABLE IF EXISTS point_events;
DROP TABLE IF EXISTS loyalty_enrollments;
DROP TABLE IF EXISTS customer_identities;
