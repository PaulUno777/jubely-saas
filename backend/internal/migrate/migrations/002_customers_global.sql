-- +goose Up
-- Phase 1 (constraint): customer is a single global identity; loyalty relationship is per store (tenant).
-- `001_init.sql` already created tenant-scoped `customers` and `enrollments`. To avoid breaking early DBs,
-- we introduce canonical tables with new names and migrate the application to them.

CREATE TABLE IF NOT EXISTS customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_enrollments_tenant_customer
    ON loyalty_enrollments (tenant_id, customer_id);

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'point_events_enrollment_id_fk'
    ) THEN
        ALTER TABLE point_events
        DROP CONSTRAINT point_events_enrollment_id_fk;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'point_events_loyalty_enrollment_id_fk'
    ) THEN
        ALTER TABLE point_events
        ADD CONSTRAINT point_events_loyalty_enrollment_id_fk
        FOREIGN KEY (enrollment_id) REFERENCES loyalty_enrollments(id) ON DELETE SET NULL;
    END IF;
END;
$$;
-- +goose StatementEnd

-- +goose Down
SELECT 1;
