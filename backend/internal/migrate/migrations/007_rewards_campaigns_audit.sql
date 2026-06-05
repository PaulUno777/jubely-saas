-- +goose Up
-- Reward images, campaigns, audit trail, campaign attribution on point events.

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS icon_key TEXT NOT NULL DEFAULT 'gift',
    ADD COLUMN IF NOT EXISTS stock_period TEXT,
    ADD COLUMN IF NOT EXISTS claimed_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    targeting_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    budget_points INT,
    reach_count INT NOT NULL DEFAULT 0,
    conversion_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT campaigns_status_chk CHECK (
        status IN ('draft', 'scheduled', 'live', 'paused', 'ended')
    )
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_status ON campaigns(tenant_id, status, starts_at);

ALTER TABLE point_events
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_created ON audit_events(tenant_id, created_at DESC);

UPDATE plan_catalog SET features = features || '{"advanced_rules":false}'::jsonb WHERE code = 'starter';
UPDATE plan_catalog SET features = features || '{"advanced_rules":true,"campaigns":true}'::jsonb WHERE code = 'growth';
UPDATE plan_catalog SET features = features || '{"advanced_rules":true,"campaigns":true,"webhooks":true}'::jsonb WHERE code = 'business';

-- +goose Down
DROP TABLE IF EXISTS audit_events;

ALTER TABLE point_events DROP COLUMN IF EXISTS campaign_id;

DROP TABLE IF EXISTS campaigns;

ALTER TABLE rewards
    DROP COLUMN IF EXISTS claimed_count,
    DROP COLUMN IF EXISTS stock_period,
    DROP COLUMN IF EXISTS icon_key,
    DROP COLUMN IF EXISTS image_url;
