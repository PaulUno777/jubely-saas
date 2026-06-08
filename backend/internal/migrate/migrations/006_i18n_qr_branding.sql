-- +goose Up
-- Tenant locales, localized merchant-facing copy, QR enrollment branding.

CREATE TABLE IF NOT EXISTS tenant_supported_locales (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    enabled BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (tenant_id, locale)
);

CREATE TABLE IF NOT EXISTS localized_strings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type TEXT NOT NULL,
    owner_id UUID NOT NULL,
    field_key TEXT NOT NULL,
    locale TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT localized_strings_owner_field_locale_uk UNIQUE (owner_type, owner_id, field_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_localized_strings_owner ON localized_strings(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS tenant_qr_branding (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    variant TEXT NOT NULL DEFAULT 'affiche',
    theme TEXT NOT NULL DEFAULT 'dark',
    accent_color TEXT NOT NULL DEFAULT '#C89B3C',
    font_family TEXT NOT NULL DEFAULT 'manrope',
    heading_font TEXT,
    qr_foreground TEXT,
    qr_background TEXT,
    layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    section_toggles JSONB NOT NULL DEFAULT '{"logo":true,"how":true,"tiers":true,"reward":true,"contact":true}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS tenant_qr_branding;
DROP TABLE IF EXISTS localized_strings;
DROP TABLE IF EXISTS tenant_supported_locales;
