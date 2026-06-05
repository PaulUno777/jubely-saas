package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsRepository struct {
	Pool *pgxpool.Pool
}

const analyticsRollupSelectCols = `
id, tenant_id, location_id, day, metrics, created_at, updated_at`

type analyticsRollupRowScanner interface {
	Scan(dest ...any) error
}

func scanAnalyticsRollup(row analyticsRollupRowScanner) (*ports.AnalyticsDailyRollup, error) {
	var rollup ports.AnalyticsDailyRollup
	var metrics []byte
	err := row.Scan(&rollup.ID, &rollup.TenantID, &rollup.LocationID, &rollup.Day, &metrics, &rollup.CreatedAt, &rollup.UpdatedAt)
	if err != nil {
		return nil, err
	}
	rollup.Metrics = metrics
	if len(metrics) == 0 {
		rollup.Metrics = []byte("{}")
	}
	return &rollup, nil
}

func (r *AnalyticsRepository) GetDailyRollup(ctx context.Context, tenantID uuid.UUID, day time.Time, locationID *uuid.UUID) (*ports.AnalyticsDailyRollup, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + analyticsRollupSelectCols + `
FROM analytics_daily_tenant
WHERE tenant_id=$1 AND day=$2::date AND location_id IS NOT DISTINCT FROM $3`
	rollup, err := scanAnalyticsRollup(db.QueryRow(ctx, q, tenantID, day, locationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return rollup, nil
}

func (r *AnalyticsRepository) UpsertDailyRollup(ctx context.Context, rollup *ports.AnalyticsDailyRollup) error {
	db := pickDB(ctx, r.Pool)
	metrics := rollup.Metrics
	if len(metrics) == 0 {
		metrics = []byte("{}")
	}
	const updateQ = `
UPDATE analytics_daily_tenant
SET metrics=$4, updated_at=$5
WHERE tenant_id=$1 AND day=$2::date AND location_id IS NOT DISTINCT FROM $3`
	res, err := db.Exec(ctx, updateQ, rollup.TenantID, rollup.Day, rollup.LocationID, metrics, rollup.UpdatedAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() > 0 {
		return nil
	}
	const insertQ = `
INSERT INTO analytics_daily_tenant (id, tenant_id, location_id, day, metrics, created_at, updated_at)
VALUES ($1,$2,$3,$4::date,$5,$6,$7)`
	_, err = db.Exec(ctx, insertQ,
		rollup.ID, rollup.TenantID, rollup.LocationID, rollup.Day, metrics, rollup.CreatedAt, rollup.UpdatedAt,
	)
	return err
}

func (r *AnalyticsRepository) ListDailyRollups(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]ports.AnalyticsDailyRollup, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + analyticsRollupSelectCols + `
FROM analytics_daily_tenant
WHERE tenant_id=$1 AND day >= $2::date AND day <= $3::date
  AND ($4::uuid IS NULL OR location_id IS NOT DISTINCT FROM $4)
ORDER BY day ASC`
	rows, err := db.Query(ctx, q, tenantID, from, to, locationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.AnalyticsDailyRollup
	for rows.Next() {
		rollup, err := scanAnalyticsRollup(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *rollup)
	}
	return out, rows.Err()
}
