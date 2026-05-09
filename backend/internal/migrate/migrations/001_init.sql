-- +goose Up
-- Jubely Phase 1 schema: tenants (self_serve), users, invitations, ledger stubs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('superadmin', 'merchant_admin', 'staff', 'customer');
    END IF;
END;
$$;
-- +goose StatementEnd

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    self_serve BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_superadmin_email
    ON users (lower(email))
    WHERE tenant_id IS NULL AND role = 'superadmin';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email
    ON users (tenant_id, lower(email))
    WHERE tenant_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS merchant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'merchant_admin',
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT merchant_invitations_role_chk CHECK (role IN ('merchant_admin', 'staff'))
);

CREATE INDEX IF NOT EXISTS idx_merchant_invitations_tenant ON merchant_invitations(tenant_id);

CREATE TABLE IF NOT EXISTS point_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    enrollment_id UUID NULL,
    event_type TEXT NOT NULL,
    delta INT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_events_tenant_created ON point_events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS points_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_json JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('active', 'inactive');
    END IF;
END;
$$;
-- +goose StatementEnd

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_phone
    ON customers (tenant_id, phone_e164);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers (tenant_id);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON enrollments(tenant_id, enrolled_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_one_active_per_customer
    ON enrollments (customer_id)
    WHERE status = 'active' AND left_at IS NULL;

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'point_events_enrollment_id_fk'
    ) THEN
        ALTER TABLE point_events
        ADD CONSTRAINT point_events_enrollment_id_fk
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL;
    END IF;
END;
$$;
-- +goose StatementEnd

-- +goose Down
-- Baseline rollback intentionally minimal; prefer restore-from-backup in prod.
SELECT 1;
