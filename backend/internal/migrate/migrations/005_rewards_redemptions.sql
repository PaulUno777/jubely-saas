-- +goose Up
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    point_cost INT NOT NULL CHECK (point_cost > 0),
    min_tier TEXT NOT NULL DEFAULT 'bronze',
    active BOOLEAN NOT NULL DEFAULT true,
    stock_limit INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_tenant_active ON rewards(tenant_id, active);

CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES loyalty_enrollments(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
    points_spent INT NOT NULL CHECK (points_spent > 0),
    status TEXT NOT NULL DEFAULT 'pending',
    claim_qr TEXT NOT NULL,
    display_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    burned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_redemptions_claim_qr ON redemptions(claim_qr);
CREATE INDEX IF NOT EXISTS idx_redemptions_enrollment ON redemptions(enrollment_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS rewards;
