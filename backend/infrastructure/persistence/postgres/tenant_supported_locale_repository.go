package postgres

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantSupportedLocaleRepository struct {
	Pool *pgxpool.Pool
}

func (r *TenantSupportedLocaleRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]domain.TenantSupportedLocale, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT tenant_id, locale, is_primary, enabled
FROM tenant_supported_locales
WHERE tenant_id=$1
ORDER BY is_primary DESC, locale ASC`
	rows, err := db.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.TenantSupportedLocale
	for rows.Next() {
		var row domain.TenantSupportedLocale
		if err := rows.Scan(&row.TenantID, &row.Locale, &row.IsPrimary, &row.Enabled); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *TenantSupportedLocaleRepository) ReplaceForTenant(ctx context.Context, tenantID uuid.UUID, locales []domain.TenantSupportedLocale) error {
	tx, err := r.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM tenant_supported_locales WHERE tenant_id=$1`, tenantID); err != nil {
		return err
	}
	const insertQ = `
INSERT INTO tenant_supported_locales (tenant_id, locale, is_primary, enabled)
VALUES ($1,$2,$3,$4)`
	for _, loc := range locales {
		if _, err := tx.Exec(ctx, insertQ, tenantID, loc.Locale, loc.IsPrimary, loc.Enabled); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
