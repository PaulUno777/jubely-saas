-- +goose Up
CREATE TABLE IF NOT EXISTS rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES points_rules(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    rule_json JSONB NOT NULL,
    editor_tier TEXT NOT NULL DEFAULT 'basic',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_summary TEXT,
    UNIQUE (rule_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_rule_versions_rule ON rule_versions(rule_id, version_number DESC);

ALTER TABLE points_rules
    ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES rule_versions(id);

-- +goose Down
ALTER TABLE points_rules DROP COLUMN IF EXISTS current_version_id;
DROP TABLE IF EXISTS rule_versions;
