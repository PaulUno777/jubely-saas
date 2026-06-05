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
INSERT INTO users (id, email, password_hash, role, permissions, must_change_password, created_at)
VALUES ($1,$2,$3,$4,$5::jsonb,$6, now())`
	perms := u.Permissions
	if len(perms) == 0 {
		perms = []byte(`[]`)
	}
	_, err := db.Exec(ctx, q, u.ID, u.Email, u.PasswordHash, u.Role.String(), []byte(perms), u.MustChangePassword)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *UserRepository) CountSuperadmins(ctx context.Context) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM users WHERE role='superadmin'`
	var n int64
	if err := db.QueryRow(ctx, q).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *UserRepository) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users
WHERE role='superadmin' AND lower(email)=lower($1)`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
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

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users
WHERE lower(email)=lower($1)`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
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
SELECT id, email, password_hash, role::text, permissions, must_change_password, created_at
FROM users WHERE id=$1`
	var u domain.User
	var role string
	var perms []byte
	err := db.QueryRow(ctx, q, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &perms, &u.MustChangePassword, &u.CreatedAt)
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
