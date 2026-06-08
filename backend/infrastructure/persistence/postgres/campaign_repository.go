package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CampaignRepository struct {
	Pool *pgxpool.Pool
}

const campaignSelectCols = `
id, tenant_id, name, campaign_type, status, starts_at, ends_at, targeting_json, action_json,
budget_points, reach_count, conversion_count, created_at, updated_at`

type campaignRowScanner interface {
	Scan(dest ...any) error
}

func scanCampaign(row campaignRowScanner) (*domain.Campaign, error) {
	var c domain.Campaign
	var targeting, action []byte
	err := row.Scan(
		&c.ID, &c.TenantID, &c.Name, &c.CampaignType, &c.Status, &c.StartsAt, &c.EndsAt,
		&targeting, &action, &c.BudgetPoints, &c.ReachCount, &c.ConversionCount, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	c.TargetingJSON = targeting
	if len(targeting) == 0 {
		c.TargetingJSON = []byte("{}")
	}
	c.ActionJSON = action
	if len(action) == 0 {
		c.ActionJSON = []byte("{}")
	}
	return &c, nil
}

func (r *CampaignRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status *string) ([]domain.Campaign, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + campaignSelectCols + ` FROM campaigns WHERE tenant_id=$1`
	args := []any{tenantID}
	if status != nil && *status != "" {
		q += ` AND status=$2`
		args = append(args, *status)
	}
	q += ` ORDER BY created_at DESC`
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Campaign
	for rows.Next() {
		c, err := scanCampaign(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, rows.Err()
}

func (r *CampaignRepository) FindByID(ctx context.Context, tenantID, campaignID uuid.UUID) (*domain.Campaign, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + campaignSelectCols + ` FROM campaigns WHERE tenant_id=$1 AND id=$2`
	c, err := scanCampaign(db.QueryRow(ctx, q, tenantID, campaignID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CampaignRepository) Create(ctx context.Context, c *domain.Campaign) error {
	db := pickDB(ctx, r.Pool)
	targeting := c.TargetingJSON
	if len(targeting) == 0 {
		targeting = []byte("{}")
	}
	action := c.ActionJSON
	if len(action) == 0 {
		action = []byte("{}")
	}
	const q = `
INSERT INTO campaigns (
  id, tenant_id, name, campaign_type, status, starts_at, ends_at, targeting_json, action_json,
  budget_points, reach_count, conversion_count, created_at, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
	_, err := db.Exec(ctx, q,
		c.ID, c.TenantID, c.Name, c.CampaignType, c.Status, c.StartsAt, c.EndsAt,
		targeting, action, c.BudgetPoints, c.ReachCount, c.ConversionCount, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *CampaignRepository) Update(ctx context.Context, c *domain.Campaign) error {
	db := pickDB(ctx, r.Pool)
	targeting := c.TargetingJSON
	if len(targeting) == 0 {
		targeting = []byte("{}")
	}
	action := c.ActionJSON
	if len(action) == 0 {
		action = []byte("{}")
	}
	const q = `
UPDATE campaigns
SET name=$3, campaign_type=$4, status=$5, starts_at=$6, ends_at=$7, targeting_json=$8, action_json=$9,
    budget_points=$10, reach_count=$11, conversion_count=$12, updated_at=$13
WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q,
		c.TenantID, c.ID, c.Name, c.CampaignType, c.Status, c.StartsAt, c.EndsAt,
		targeting, action, c.BudgetPoints, c.ReachCount, c.ConversionCount, c.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *CampaignRepository) CountByTenant(ctx context.Context, tenantID uuid.UUID, status *string) (int64, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT count(*) FROM campaigns WHERE tenant_id=$1`
	args := []any{tenantID}
	if status != nil && *status != "" {
		q += ` AND status=$2`
		args = append(args, *status)
	}
	var n int64
	if err := db.QueryRow(ctx, q, args...).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}
