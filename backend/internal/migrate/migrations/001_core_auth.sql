-- +goose Up
-- Jubelee platform core: organizations (tenants), users, staff access, auth sessions.

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
    active BOOLEAN NOT NULL DEFAULT true,
    plan TEXT NOT NULL DEFAULT 'starter',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    allow_staff_self_enrollment BOOLEAN NOT NULL DEFAULT false,
    conflict_policy TEXT NOT NULL DEFAULT 'HIGHEST_WINS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tenants_plan_chk CHECK (plan IN ('starter', 'growth', 'business'))
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tenant_memberships_role_chk CHECK (role IN ('merchant_admin', 'staff')),
    CONSTRAINT tenant_memberships_user_tenant_uk UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON tenant_memberships(user_id);

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

CREATE TABLE IF NOT EXISTS user_mfa_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('totp', 'passkey')),
    label TEXT,
    secret_enc BYTEA,
    credential_id BYTEA,
    public_key BYTEA,
    sign_count BIGINT NOT NULL DEFAULT 0,
    transports TEXT[],
    enabled_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_mfa_factors_user_id_idx ON user_mfa_factors(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_mfa_factors_credential_id_uk
    ON user_mfa_factors(credential_id)
    WHERE credential_id IS NOT NULL;

-- active_enrollment_id FK added in 003_loyalty.sql after loyalty_enrollments exists.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    active_membership_id UUID REFERENCES tenant_memberships(id) ON DELETE SET NULL,
    active_enrollment_id UUID,
    user_agent TEXT,
    ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('authentication', 'registration')),
    session_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webauthn_challenges_user_kind_idx ON webauthn_challenges(user_id, kind);
CREATE INDEX IF NOT EXISTS webauthn_challenges_expires_idx ON webauthn_challenges(expires_at);

-- +goose Down
DROP TABLE IF EXISTS webauthn_challenges;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS user_mfa_factors;
DROP TABLE IF EXISTS merchant_invitations;
DROP TABLE IF EXISTS tenant_memberships;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
DROP TYPE IF EXISTS user_role;
