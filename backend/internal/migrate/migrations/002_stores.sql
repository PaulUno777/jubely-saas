-- +goose Up
-- Physical boutiques under an organization (tenants row).

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'CM',
    city TEXT NOT NULL DEFAULT '',
    address_line TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'soon', 'closed')),
    is_hq BOOLEAN NOT NULL DEFAULT false,
    timezone TEXT NOT NULL DEFAULT 'Africa/Douala',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stores_org_slug_uk UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_stores_organization ON stores(organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_one_hq_per_org
    ON stores (organization_id)
    WHERE is_hq = true;

CREATE TABLE IF NOT EXISTS store_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT store_memberships_user_store_uk UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_memberships_store ON store_memberships(store_id);
CREATE INDEX IF NOT EXISTS idx_store_memberships_user ON store_memberships(user_id);

-- +goose Down
DROP TABLE IF EXISTS store_memberships;
DROP TABLE IF EXISTS stores;
