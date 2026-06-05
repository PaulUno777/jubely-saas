-- +goose Up
-- Physical locations (boutiques) under a tenant.

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'CM',
    state_code TEXT NOT NULL DEFAULT '',
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
    CONSTRAINT locations_tenant_slug_uk UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_one_hq_per_tenant
    ON locations (tenant_id)
    WHERE is_hq = true;

CREATE INDEX IF NOT EXISTS idx_locations_geo ON locations (lat, lng)
    WHERE lat IS NOT NULL AND lng IS NOT NULL AND status = 'open';

CREATE TABLE IF NOT EXISTS location_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT location_memberships_user_location_uk UNIQUE (user_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_location_memberships_location ON location_memberships(location_id);
CREATE INDEX IF NOT EXISTS idx_location_memberships_user ON location_memberships(user_id);

-- +goose Down
DROP TABLE IF EXISTS location_memberships;
DROP TABLE IF EXISTS locations;
