package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LoyaltyTierRepository struct {
	Pool *pgxpool.Pool
}

const loyaltyTierSelectCols = `
id, tenant_id, code, sort_order, min_points, color, icon_key, auto_upgrade, benefits_json, active, created_at, updated_at`

type loyaltyTierRowScanner interface {
	Scan(dest ...any) error
}

func scanLoyaltyTier(row loyaltyTierRowScanner) (*domain.LoyaltyTier, error) {
	var t domain.LoyaltyTier
	var benefits []byte
	err := row.Scan(
		&t.ID, &t.TenantID, &t.Code, &t.SortOrder, &t.MinPoints, &t.Color, &t.IconKey,
		&t.AutoUpgrade, &benefits, &t.Active, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	t.BenefitsJSON = benefits
	if len(benefits) == 0 {
		t.BenefitsJSON = []byte("{}")
	}
	return &t, nil
}

func (r *LoyaltyTierRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]domain.LoyaltyTier, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + loyaltyTierSelectCols + ` FROM loyalty_tiers WHERE tenant_id=$1`
	if activeOnly {
		q += ` AND active=true`
	}
	q += ` ORDER BY sort_order ASC, code ASC`
	rows, err := db.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LoyaltyTier
	for rows.Next() {
		t, err := scanLoyaltyTier(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *t)
	}
	return out, rows.Err()
}

func (r *LoyaltyTierRepository) FindByID(ctx context.Context, tenantID, tierID uuid.UUID) (*domain.LoyaltyTier, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + loyaltyTierSelectCols + ` FROM loyalty_tiers WHERE tenant_id=$1 AND id=$2`
	t, err := scanLoyaltyTier(db.QueryRow(ctx, q, tenantID, tierID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *LoyaltyTierRepository) FindByCode(ctx context.Context, tenantID uuid.UUID, code string) (*domain.LoyaltyTier, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + loyaltyTierSelectCols + ` FROM loyalty_tiers WHERE tenant_id=$1 AND lower(code)=lower($2)`
	t, err := scanLoyaltyTier(db.QueryRow(ctx, q, tenantID, code))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *LoyaltyTierRepository) Create(ctx context.Context, tier *domain.LoyaltyTier) error {
	db := pickDB(ctx, r.Pool)
	benefits := tier.BenefitsJSON
	if len(benefits) == 0 {
		benefits = []byte("{}")
	}
	const q = `
INSERT INTO loyalty_tiers (
  id, tenant_id, code, sort_order, min_points, color, icon_key, auto_upgrade, benefits_json, active, created_at, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`
	_, err := db.Exec(ctx, q,
		tier.ID, tier.TenantID, tier.Code, tier.SortOrder, tier.MinPoints, tier.Color, tier.IconKey,
		tier.AutoUpgrade, benefits, tier.Active, tier.CreatedAt, tier.UpdatedAt,
	)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *LoyaltyTierRepository) Update(ctx context.Context, tier *domain.LoyaltyTier) error {
	db := pickDB(ctx, r.Pool)
	benefits := tier.BenefitsJSON
	if len(benefits) == 0 {
		benefits = []byte("{}")
	}
	const q = `
UPDATE loyalty_tiers
SET code=$3, sort_order=$4, min_points=$5, color=$6, icon_key=$7, auto_upgrade=$8,
    benefits_json=$9, active=$10, updated_at=$11
WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q,
		tier.TenantID, tier.ID, tier.Code, tier.SortOrder, tier.MinPoints, tier.Color, tier.IconKey,
		tier.AutoUpgrade, benefits, tier.Active, tier.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
