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
INSERT INTO users (id, tenant_id, email, password_hash, role, permissions, must_change_password, created_at)
VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7, now())`
	perms := u.Permissions
	if len(perms) == 0 {
		perms = []byte(`[]`)
	}
	_, err := db.Exec(ctx, q, u.ID, u.TenantID, u.Email, u.PasswordHash, u.Role.String(), []byte(perms), u.MustChangePassword)
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
SELECT id, tenant_id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users
WHERE tenant_id IS NULL AND role='superadmin' AND lower(email)=lower($1)`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, email).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	u.Permissions = append([]byte(nil), perms...)
	return &u, nil
}

func (r *UserRepository) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users
WHERE tenant_id=$1 AND lower(email)=lower($2)`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, tenantID, email).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	u.Permissions = append([]byte(nil), perms...)
	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users WHERE id=$1`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, id).Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	u.Permissions = append([]byte(nil), perms...)
	return &u, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustChangePassword bool) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE users
SET password_hash=$2, must_change_password=$3
WHERE id=$1`
	res, err := db.Exec(ctx, q, id, passwordHash, mustChangePassword)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *UserRepository) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM users WHERE tenant_id=$1`
	var n int64
	if err := db.QueryRow(ctx, q, tenantID).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *UserRepository) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, email, role::text, created_at
FROM users
WHERE tenant_id=$1
ORDER BY created_at DESC
OFFSET $2 LIMIT $3`
	rows, err := db.Query(ctx, q, tenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.UserPublic
	for rows.Next() {
		var row domain.UserPublic
		var role string
		if err := rows.Scan(&row.ID, &row.Email, &role, &row.CreatedAt); err != nil {
			return nil, err
		}
		row.Role = domain.Role(role)
		out = append(out, row)
	}
	return out, rows.Err()
}
