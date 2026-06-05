package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QRBrandingRepository struct {
	Pool *pgxpool.Pool
}

const qrBrandingSelectCols = `
tenant_id, variant, theme, accent_color, font_family, heading_font, qr_foreground, qr_background, layout_json, section_toggles, updated_at`

type qrBrandingRowScanner interface {
	Scan(dest ...any) error
}

func scanQRBranding(row qrBrandingRowScanner) (*domain.TenantQRBranding, error) {
	var b domain.TenantQRBranding
	var layout, toggles []byte
	err := row.Scan(
		&b.TenantID, &b.Variant, &b.Theme, &b.AccentColor, &b.FontFamily, &b.HeadingFont,
		&b.QRForeground, &b.QRBackground, &layout, &toggles, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	b.LayoutJSON = layout
	if len(layout) == 0 {
		b.LayoutJSON = []byte("{}")
	}
	b.SectionToggles = toggles
	if len(toggles) == 0 {
		b.SectionToggles = []byte(`{"logo":true,"how":true,"tiers":true,"reward":true,"contact":true}`)
	}
	return &b, nil
}

func (r *QRBrandingRepository) FindByTenant(ctx context.Context, tenantID uuid.UUID) (*domain.TenantQRBranding, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + qrBrandingSelectCols + ` FROM tenant_qr_branding WHERE tenant_id=$1`
	b, err := scanQRBranding(db.QueryRow(ctx, q, tenantID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *QRBrandingRepository) Upsert(ctx context.Context, b *domain.TenantQRBranding) error {
	db := pickDB(ctx, r.Pool)
	layout := b.LayoutJSON
	if len(layout) == 0 {
		layout = []byte("{}")
	}
	toggles := b.SectionToggles
	if len(toggles) == 0 {
		toggles = []byte(`{"logo":true,"how":true,"tiers":true,"reward":true,"contact":true}`)
	}
	const q = `
INSERT INTO tenant_qr_branding (
  tenant_id, variant, theme, accent_color, font_family, heading_font, qr_foreground, qr_background, layout_json, section_toggles, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
ON CONFLICT (tenant_id) DO UPDATE SET
  variant=EXCLUDED.variant,
  theme=EXCLUDED.theme,
  accent_color=EXCLUDED.accent_color,
  font_family=EXCLUDED.font_family,
  heading_font=EXCLUDED.heading_font,
  qr_foreground=EXCLUDED.qr_foreground,
  qr_background=EXCLUDED.qr_background,
  layout_json=EXCLUDED.layout_json,
  section_toggles=EXCLUDED.section_toggles,
  updated_at=EXCLUDED.updated_at`
	_, err := db.Exec(ctx, q,
		b.TenantID, b.Variant, b.Theme, b.AccentColor, b.FontFamily, b.HeadingFont,
		b.QRForeground, b.QRBackground, layout, toggles, b.UpdatedAt,
	)
	return err
}
