package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	Pool *pgxpool.Pool
}

func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO users (id, tenant_id, email, password_hash, role, created_at)
VALUES ($1,$2,$3,$4,$5, now())`
	_, err := db.Exec(ctx, q, u.ID, u.TenantID, u.Email, u.PasswordHash, u.Role.String())
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *UserRepository) CountSuperadmins(ctx context.Context) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM users WHERE role='superadmin' AND tenant_id IS NULL`
	var n int64
	if err := db.QueryRow(ctx, q).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *UserRepository) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, password_hash, role::text, created_at
FROM users
WHERE tenant_id IS NULL AND role='superadmin' AND lower(email)=lower($1)`
	var u domain.User
	var role string
	err := db.QueryRow(ctx, q, email).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	return &u, nil
}

func (r *UserRepository) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, password_hash, role::text, created_at
FROM users
WHERE tenant_id=$1 AND lower(email)=lower($2)`
	var u domain.User
	var role string
	err := db.QueryRow(ctx, q, tenantID, email).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, password_hash, role::text, created_at
FROM users WHERE id=$1`
	var u domain.User
	var role string
	err := db.QueryRow(ctx, q, id).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	return &u, nil
}
