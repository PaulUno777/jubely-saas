-- +goose Up
-- Phase 1: tenant fields for superadmin dashboard (aligned with planning: plan, active, settings).

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenants_plan_chk'
    ) THEN
        ALTER TABLE tenants
            ADD CONSTRAINT tenants_plan_chk
            CHECK (plan IN ('starter', 'growth', 'business'));
    END IF;
END;
$$;
-- +goose StatementEnd

-- +goose Down
SELECT 1;
