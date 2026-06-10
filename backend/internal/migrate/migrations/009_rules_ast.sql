-- +goose Up
ALTER TABLE points_rules
    ADD COLUMN IF NOT EXISTS editor_tier TEXT NOT NULL DEFAULT 'basic',
    ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_points_rules_tenant_frozen
    ON points_rules(tenant_id) WHERE frozen_at IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_points_rules_tenant_frozen;
ALTER TABLE points_rules
    DROP COLUMN IF EXISTS frozen_reason,
    DROP COLUMN IF EXISTS frozen_at,
    DROP COLUMN IF EXISTS editor_tier;
