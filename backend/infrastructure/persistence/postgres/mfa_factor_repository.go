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

type MFAFactorRepository struct {
	Pool *pgxpool.Pool
}

func (r *MFAFactorRepository) CreateTOTP(ctx context.Context, in ports.CreateTOTPFactorInput) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO user_mfa_factors (id, user_id, type, label, secret_enc, created_at)
VALUES ($1,$2,'totp',$3,$4,$5)`
	_, err := db.Exec(ctx, q, in.ID, in.UserID, in.Label, in.SecretEnc, in.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *MFAFactorRepository) CreatePasskey(ctx context.Context, in ports.CreatePasskeyFactorInput) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO user_mfa_factors (
  id, user_id, type, label,
  credential_id, public_key, sign_count, transports,
  enabled_at, last_used_at, created_at
)
VALUES ($1,$2,'passkey',$3,$4,$5,$6,$7,$8,$9,$10)`
	_, err := db.Exec(
		ctx,
		q,
		in.ID,
		in.UserID,
		in.Label,
		in.CredentialID,
		in.PublicKey,
		in.SignCount,
		in.Transports,
		in.EnabledAt,
		in.LastUsedAt,
		in.CreatedAt,
	)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *MFAFactorRepository) FindByID(ctx context.Context, id uuid.UUID) (*ports.MFAFactorRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, type, label, enabled_at, last_used_at, created_at,
       secret_enc, credential_id, public_key, sign_count, transports
FROM user_mfa_factors
WHERE id=$1`
	var out ports.MFAFactorRow
	var typ string
	err := db.QueryRow(ctx, q, id).Scan(
		&out.ID,
		&out.UserID,
		&typ,
		&out.Label,
		&out.EnabledAt,
		&out.LastUsedAt,
		&out.CreatedAt,
		&out.SecretEnc,
		&out.CredentialID,
		&out.PublicKey,
		&out.SignCount,
		&out.Transports,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	out.Type = ports.MFAFactorType(typ)
	return &out, nil
}

func (r *MFAFactorRepository) ListEnabledPasskeysByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactorRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, type, label, enabled_at, last_used_at, created_at,
       secret_enc, credential_id, public_key, sign_count, transports
FROM user_mfa_factors
WHERE user_id=$1 AND type='passkey' AND enabled_at IS NOT NULL
ORDER BY created_at DESC`
	rows, err := db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.MFAFactorRow
	for rows.Next() {
		var row ports.MFAFactorRow
		var typ string
		if err := rows.Scan(
			&row.ID,
			&row.UserID,
			&typ,
			&row.Label,
			&row.EnabledAt,
			&row.LastUsedAt,
			&row.CreatedAt,
			&row.SecretEnc,
			&row.CredentialID,
			&row.PublicKey,
			&row.SignCount,
			&row.Transports,
		); err != nil {
			return nil, err
		}
		row.Type = ports.MFAFactorType(typ)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *MFAFactorRepository) FindEnabledPasskeyByCredentialID(ctx context.Context, credentialID []byte) (*ports.MFAFactorRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, type, label, enabled_at, last_used_at, created_at,
       secret_enc, credential_id, public_key, sign_count, transports
FROM user_mfa_factors
WHERE credential_id=$1 AND type='passkey' AND enabled_at IS NOT NULL`
	var out ports.MFAFactorRow
	var typ string
	err := db.QueryRow(ctx, q, credentialID).Scan(
		&out.ID,
		&out.UserID,
		&typ,
		&out.Label,
		&out.EnabledAt,
		&out.LastUsedAt,
		&out.CreatedAt,
		&out.SecretEnc,
		&out.CredentialID,
		&out.PublicKey,
		&out.SignCount,
		&out.Transports,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	out.Type = ports.MFAFactorType(typ)
	return &out, nil
}

func (r *MFAFactorRepository) TouchPasskey(ctx context.Context, id uuid.UUID, signCount int64, usedAt time.Time) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE user_mfa_factors
SET sign_count=$2, last_used_at=$3
WHERE id=$1 AND type='passkey'`
	res, err := db.Exec(ctx, q, id, signCount, usedAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *MFAFactorRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactor, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, type, label, enabled_at, last_used_at, created_at
FROM user_mfa_factors
WHERE user_id=$1
ORDER BY created_at DESC`
	rows, err := db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.MFAFactor
	for rows.Next() {
		var row ports.MFAFactor
		var typ string
		if err := rows.Scan(&row.ID, &row.UserID, &typ, &row.Label, &row.EnabledAt, &row.LastUsedAt, &row.CreatedAt); err != nil {
			return nil, err
		}
		row.Type = ports.MFAFactorType(typ)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *MFAFactorRepository) ListEnabledTOTPByUser(ctx context.Context, userID uuid.UUID) ([]ports.MFAFactorRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, type, label, enabled_at, last_used_at, created_at,
       secret_enc, credential_id, public_key, sign_count, transports
FROM user_mfa_factors
WHERE user_id=$1 AND type='totp' AND enabled_at IS NOT NULL
ORDER BY created_at DESC`
	rows, err := db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ports.MFAFactorRow
	for rows.Next() {
		var row ports.MFAFactorRow
		var typ string
		if err := rows.Scan(
			&row.ID,
			&row.UserID,
			&typ,
			&row.Label,
			&row.EnabledAt,
			&row.LastUsedAt,
			&row.CreatedAt,
			&row.SecretEnc,
			&row.CredentialID,
			&row.PublicKey,
			&row.SignCount,
			&row.Transports,
		); err != nil {
			return nil, err
		}
		row.Type = ports.MFAFactorType(typ)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *MFAFactorRepository) Enable(ctx context.Context, id uuid.UUID, enabledAt time.Time) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE user_mfa_factors
SET enabled_at=$2
WHERE id=$1`
	res, err := db.Exec(ctx, q, id, enabledAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *MFAFactorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	const q = `DELETE FROM user_mfa_factors WHERE id=$1`
	res, err := db.Exec(ctx, q, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *MFAFactorRepository) CountEnabledByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM user_mfa_factors WHERE user_id=$1 AND enabled_at IS NOT NULL`
	var n int64
	if err := db.QueryRow(ctx, q, userID).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}
