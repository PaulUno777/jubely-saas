-- +goose Up
-- Daily analytics rollups for tenant dashboards.

CREATE TABLE IF NOT EXISTS analytics_daily_tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_tenant_scope
    ON analytics_daily_tenant (tenant_id, day, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_analytics_daily_tenant_day
    ON analytics_daily_tenant(tenant_id, day DESC);

-- +goose Down
DROP TABLE IF EXISTS analytics_daily_tenant;
