-- +goose Up
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS conflict_policy TEXT NOT NULL DEFAULT 'HIGHEST_WINS';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

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

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
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

ALTER TABLE users DROP COLUMN IF EXISTS must_change_password;
ALTER TABLE users DROP COLUMN IF EXISTS permissions;

ALTER TABLE tenants DROP COLUMN IF EXISTS conflict_policy;
