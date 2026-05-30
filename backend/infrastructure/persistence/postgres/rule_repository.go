package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PointsRuleRepository struct {
	Pool *pgxpool.Pool
}

func (r *PointsRuleRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]ports.PointsRuleRecord, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, rule_json, active, COALESCE(priority, 0)
FROM points_rules WHERE tenant_id=$1 ORDER BY priority ASC, created_at ASC`
	rows, err := db.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.PointsRuleRecord
	for rows.Next() {
		var rec ports.PointsRuleRecord
		if err := rows.Scan(&rec.ID, &rec.TenantID, &rec.RuleJSON, &rec.Active, &rec.Priority); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}

func (r *PointsRuleRepository) FindByID(ctx context.Context, tenantID, ruleID uuid.UUID) (*ports.PointsRuleRecord, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, rule_json, active, COALESCE(priority, 0)
FROM points_rules WHERE tenant_id=$1 AND id=$2`
	var rec ports.PointsRuleRecord
	err := db.QueryRow(ctx, q, tenantID, ruleID).Scan(&rec.ID, &rec.TenantID, &rec.RuleJSON, &rec.Active, &rec.Priority)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *PointsRuleRepository) Create(ctx context.Context, rec *ports.PointsRuleRecord) error {
	db := pickDB(ctx, r.Pool)
	const q = `INSERT INTO points_rules (id, tenant_id, rule_json, active, priority) VALUES ($1,$2,$3,$4,$5)`
	_, err := db.Exec(ctx, q, rec.ID, rec.TenantID, rec.RuleJSON, rec.Active, rec.Priority)
	return err
}

func (r *PointsRuleRepository) Update(ctx context.Context, rec *ports.PointsRuleRecord) error {
	db := pickDB(ctx, r.Pool)
	const q = `UPDATE points_rules SET rule_json=$3, active=$4, priority=$5 WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q, rec.TenantID, rec.ID, rec.RuleJSON, rec.Active, rec.Priority)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
