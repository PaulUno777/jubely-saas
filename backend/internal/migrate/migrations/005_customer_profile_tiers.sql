-- +goose Up
-- Customer profile fields, enrollment tracking, loyalty tiers, point event attribution.

ALTER TABLE customer_identities
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS neighborhood TEXT,
    ADD COLUMN IF NOT EXISTS job_title TEXT,
    ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'fr',
    ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    min_points INT NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#B07A4A',
    icon_key TEXT,
    auto_upgrade BOOLEAN NOT NULL DEFAULT true,
    benefits_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT loyalty_tiers_tenant_code_uk UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tenant ON loyalty_tiers(tenant_id, sort_order ASC);

ALTER TABLE loyalty_enrollments
    ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES loyalty_tiers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enrollment_source TEXT NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS enrollment_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_interaction_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lifetime_spend_fcfa BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visit_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_loyalty_enrollments_last_interaction
    ON loyalty_enrollments(tenant_id, last_interaction_at DESC NULLS LAST);

ALTER TABLE point_events
    ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rule_ids_applied UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_point_events_actor ON point_events(actor_user_id, created_at DESC)
    WHERE actor_user_id IS NOT NULL;

-- +goose Down
ALTER TABLE point_events
    DROP COLUMN IF EXISTS rule_ids_applied,
    DROP COLUMN IF EXISTS actor_user_id;

ALTER TABLE loyalty_enrollments
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS visit_count,
    DROP COLUMN IF EXISTS lifetime_spend_fcfa,
    DROP COLUMN IF EXISTS last_interaction_location_id,
    DROP COLUMN IF EXISTS last_interaction_at,
    DROP COLUMN IF EXISTS enrollment_location_id,
    DROP COLUMN IF EXISTS enrollment_source,
    DROP COLUMN IF EXISTS tier_id;

DROP TABLE IF EXISTS loyalty_tiers;

ALTER TABLE customer_identities
    DROP COLUMN IF EXISTS notification_prefs,
    DROP COLUMN IF EXISTS profile_completed_at,
    DROP COLUMN IF EXISTS interests,
    DROP COLUMN IF EXISTS preferred_locale,
    DROP COLUMN IF EXISTS job_title,
    DROP COLUMN IF EXISTS neighborhood,
    DROP COLUMN IF EXISTS date_of_birth,
    DROP COLUMN IF EXISTS gender;
