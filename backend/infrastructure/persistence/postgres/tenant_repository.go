package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type tenantRowScanner interface {
	Scan(dest ...any) error
}

type TenantRepository struct {
	Pool *pgxpool.Pool
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func scanTenant(row tenantRowScanner) (*domain.Tenant, error) {
	var t domain.Tenant
	var settings []byte
	err := row.Scan(
		&t.ID, &t.Name, &t.Slug, &t.SelfServe, &t.Active, &t.Plan, &t.ConflictPolicy, &t.AllowStaffSelfEnrollment, &settings,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(settings) > 0 {
		t.Settings = json.RawMessage(append([]byte(nil), settings...))
	} else {
		t.Settings = json.RawMessage(`{}`)
	}
	return &t, nil
}

func (r *TenantRepository) Create(ctx context.Context, t *domain.Tenant) error {
	db := pickDB(ctx, r.Pool)
	settings := t.Settings
	if len(settings) == 0 {
		settings = json.RawMessage(`{}`)
	}
	const q = `
INSERT INTO tenants (id, name, slug, self_serve, active, plan, conflict_policy, allow_staff_self_enrollment, settings, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`
	_, err := db.Exec(ctx, q, t.ID, t.Name, t.Slug, t.SelfServe, t.Active, t.Plan, t.ConflictPolicy, t.AllowStaffSelfEnrollment, []byte(settings), t.CreatedAt, t.UpdatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *TenantRepository) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, name, slug, self_serve, active, plan, conflict_policy, allow_staff_self_enrollment, settings, created_at, updated_at
FROM tenants WHERE lower(slug)=lower($1)`
	t, err := scanTenant(db.QueryRow(ctx, q, slug))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *TenantRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, name, slug, self_serve, active, plan, conflict_policy, allow_staff_self_enrollment, settings, created_at, updated_at
FROM tenants WHERE id=$1`
	t, err := scanTenant(db.QueryRow(ctx, q, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *TenantRepository) Update(ctx context.Context, t *domain.Tenant) error {
	db := pickDB(ctx, r.Pool)
	settings := t.Settings
	if len(settings) == 0 {
		settings = json.RawMessage(`{}`)
	}
	const q = `
UPDATE tenants
SET name=$2, self_serve=$3, active=$4, plan=$5, conflict_policy=$6, allow_staff_self_enrollment=$7, settings=$8::jsonb, updated_at=$9
WHERE id=$1`
	res, err := db.Exec(ctx, q, t.ID, t.Name, t.SelfServe, t.Active, t.Plan, t.ConflictPolicy, t.AllowStaffSelfEnrollment, []byte(settings), t.UpdatedAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TenantRepository) ListAll(ctx context.Context, offset, limit int) ([]domain.Tenant, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, name, slug, self_serve, active, plan, conflict_policy, allow_staff_self_enrollment, settings, created_at, updated_at
FROM tenants
ORDER BY created_at DESC
OFFSET $1 LIMIT $2`
	rows, err := db.Query(ctx, q, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Tenant
	for rows.Next() {
		t, err := scanTenant(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *t)
	}
	return out, rows.Err()
}

func (r *TenantRepository) CountAll(ctx context.Context) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM tenants`
	var n int64
	if err := db.QueryRow(ctx, q).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *TenantRepository) CountActive(ctx context.Context) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM tenants WHERE active=true`
	var n int64
	if err := db.QueryRow(ctx, q).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *TenantRepository) CountActiveByPlan(ctx context.Context, plan string) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM tenants WHERE active=true AND lower(plan)=lower($1)`
	var n int64
	if err := db.QueryRow(ctx, q, plan).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}
