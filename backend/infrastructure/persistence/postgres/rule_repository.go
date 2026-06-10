package postgres

import (
	"context"
	"encoding/json"
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
SELECT id, tenant_id, rule_json, active, COALESCE(priority, 0),
       COALESCE(editor_tier, 'basic'), frozen_at, frozen_reason, current_version_id, created_at
FROM points_rules WHERE tenant_id=$1 ORDER BY priority ASC, created_at ASC`
	rows, err := db.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.PointsRuleRecord
	for rows.Next() {
		var rec ports.PointsRuleRecord
		if err := rows.Scan(&rec.ID, &rec.TenantID, &rec.RuleJSON, &rec.Active, &rec.Priority,
			&rec.EditorTier, &rec.FrozenAt, &rec.FrozenReason, &rec.CurrentVersionID, &rec.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}

func (r *PointsRuleRepository) FindByID(ctx context.Context, tenantID, ruleID uuid.UUID) (*ports.PointsRuleRecord, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, rule_json, active, COALESCE(priority, 0),
       COALESCE(editor_tier, 'basic'), frozen_at, frozen_reason, current_version_id, created_at
FROM points_rules WHERE tenant_id=$1 AND id=$2`
	var rec ports.PointsRuleRecord
	err := db.QueryRow(ctx, q, tenantID, ruleID).Scan(&rec.ID, &rec.TenantID, &rec.RuleJSON, &rec.Active, &rec.Priority,
		&rec.EditorTier, &rec.FrozenAt, &rec.FrozenReason, &rec.CurrentVersionID, &rec.CreatedAt)
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
	if rec.EditorTier == "" {
		rec.EditorTier = "basic"
	}
	const q = `INSERT INTO points_rules (id, tenant_id, rule_json, active, priority, editor_tier, current_version_id)
VALUES ($1,$2,$3,$4,$5,$6,$7)`
	_, err := db.Exec(ctx, q, rec.ID, rec.TenantID, rec.RuleJSON, rec.Active, rec.Priority, rec.EditorTier, rec.CurrentVersionID)
	return err
}

func (r *PointsRuleRepository) Update(ctx context.Context, rec *ports.PointsRuleRecord) error {
	db := pickDB(ctx, r.Pool)
	const q = `UPDATE points_rules SET rule_json=$3, active=$4, priority=$5, editor_tier=$6,
frozen_at=$7, frozen_reason=$8, current_version_id=$9
WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q, rec.TenantID, rec.ID, rec.RuleJSON, rec.Active, rec.Priority, rec.EditorTier,
		rec.FrozenAt, rec.FrozenReason, rec.CurrentVersionID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PointsRuleRepository) Delete(ctx context.Context, tenantID, ruleID uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	res, err := db.Exec(ctx, `DELETE FROM points_rules WHERE tenant_id=$1 AND id=$2`, tenantID, ruleID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PointsRuleRepository) FreezeAdvancedByTenant(ctx context.Context, tenantID uuid.UUID, reason string) error {
	db := pickDB(ctx, r.Pool)
	_, err := db.Exec(ctx, `
UPDATE points_rules
SET frozen_at=COALESCE(frozen_at, now()), frozen_reason=$2, active=false,
    rule_json = rule_json || jsonb_build_object('frozen', true, 'frozenReason', $2::text)
WHERE tenant_id=$1 AND editor_tier='advanced'`, tenantID, reason)
	return err
}

func (r *PointsRuleRepository) RecomputePriorities(ctx context.Context, tenantID uuid.UUID, priorities map[uuid.UUID]int) error {
	db := pickDB(ctx, r.Pool)
	for id, p := range priorities {
		if _, err := db.Exec(ctx, `UPDATE points_rules SET priority=$3 WHERE tenant_id=$1 AND id=$2`, tenantID, id, p); err != nil {
			return err
		}
	}
	return nil
}

type RuleVersionRepository struct {
	Pool *pgxpool.Pool
}

func (r *RuleVersionRepository) Create(ctx context.Context, rec *ports.RuleVersionRecord) error {
	db := pickDB(ctx, r.Pool)
	const q = `INSERT INTO rule_versions (id, rule_id, tenant_id, version_number, rule_json, editor_tier, created_by, change_summary)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`
	_, err := db.Exec(ctx, q, rec.ID, rec.RuleID, rec.TenantID, rec.VersionNumber, rec.RuleJSON, rec.EditorTier, rec.CreatedBy, rec.ChangeSummary)
	return err
}

func (r *RuleVersionRepository) ListByRule(ctx context.Context, tenantID, ruleID uuid.UUID, limit int) ([]ports.RuleVersionRecord, error) {
	if limit <= 0 {
		limit = 20
	}
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT id, rule_id, tenant_id, version_number, rule_json, editor_tier, created_by, created_at, change_summary
FROM rule_versions WHERE tenant_id=$1 AND rule_id=$2 ORDER BY version_number DESC LIMIT $3`, tenantID, ruleID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.RuleVersionRecord
	for rows.Next() {
		var rec ports.RuleVersionRecord
		if err := rows.Scan(&rec.ID, &rec.RuleID, &rec.TenantID, &rec.VersionNumber, &rec.RuleJSON,
			&rec.EditorTier, &rec.CreatedBy, &rec.CreatedAt, &rec.ChangeSummary); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}

func (r *RuleVersionRepository) FindByID(ctx context.Context, tenantID, versionID uuid.UUID) (*ports.RuleVersionRecord, error) {
	db := pickDB(ctx, r.Pool)
	var rec ports.RuleVersionRecord
	err := db.QueryRow(ctx, `
SELECT id, rule_id, tenant_id, version_number, rule_json, editor_tier, created_by, created_at, change_summary
FROM rule_versions WHERE tenant_id=$1 AND id=$2`, tenantID, versionID).
		Scan(&rec.ID, &rec.RuleID, &rec.TenantID, &rec.VersionNumber, &rec.RuleJSON,
			&rec.EditorTier, &rec.CreatedBy, &rec.CreatedAt, &rec.ChangeSummary)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *RuleVersionRepository) NextVersionNumber(ctx context.Context, ruleID uuid.UUID) (int, error) {
	db := pickDB(ctx, r.Pool)
	var n *int
	err := db.QueryRow(ctx, `SELECT max(version_number) FROM rule_versions WHERE rule_id=$1`, ruleID).Scan(&n)
	if err != nil {
		return 0, err
	}
	if n == nil {
		return 1, nil
	}
	return *n + 1, nil
}

type PurchaseIngestionRepository struct {
	Pool *pgxpool.Pool
}

func (r *PurchaseIngestionRepository) FindByKey(ctx context.Context, tenantID uuid.UUID, key string) (json.RawMessage, int, error) {
	db := pickDB(ctx, r.Pool)
	var payload []byte
	var pts int
	err := db.QueryRow(ctx, `
SELECT payload, points_awarded FROM purchase_ingestions WHERE tenant_id=$1 AND idempotency_key=$2`, tenantID, key).
		Scan(&payload, &pts)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, 0, domain.ErrNotFound
	}
	if err != nil {
		return nil, 0, err
	}
	return payload, pts, nil
}

func (r *PurchaseIngestionRepository) Insert(ctx context.Context, tenantID uuid.UUID, key string, enrollmentID *uuid.UUID, amountFcfa int64, points int, payload json.RawMessage) error {
	db := pickDB(ctx, r.Pool)
	if len(payload) == 0 {
		payload = []byte("{}")
	}
	_, err := db.Exec(ctx, `
INSERT INTO purchase_ingestions (id, tenant_id, idempotency_key, enrollment_id, amount_fcfa, points_awarded, payload)
VALUES ($1,$2,$3,$4,$5,$6,$7)`, uuid.New(), tenantID, key, enrollmentID, amountFcfa, points, payload)
	return err
}
