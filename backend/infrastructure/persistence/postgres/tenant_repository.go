package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepository struct {
	Pool *pgxpool.Pool
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (r *TenantRepository) Create(ctx context.Context, t *domain.Tenant) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO tenants (id, name, slug, self_serve, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := db.Exec(ctx, q, t.ID, t.Name, t.Slug, t.SelfServe, t.CreatedAt, t.UpdatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *TenantRepository) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, name, slug, self_serve, created_at, updated_at
FROM tenants WHERE lower(slug)=lower($1)`
	var t domain.Tenant
	err := db.QueryRow(ctx, q, slug).Scan(&t.ID, &t.Name, &t.Slug, &t.SelfServe, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TenantRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, name, slug, self_serve, created_at, updated_at
FROM tenants WHERE id=$1`
	var t domain.Tenant
	err := db.QueryRow(ctx, q, id).Scan(&t.ID, &t.Name, &t.Slug, &t.SelfServe, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}
