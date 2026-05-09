package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RefreshTokenRepository struct {
	Pool *pgxpool.Pool
}

func (r *RefreshTokenRepository) Create(ctx context.Context, in ports.RefreshTokenCreateInput) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip, expires_at)
VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := db.Exec(ctx, q, in.ID, in.UserID, in.TokenHash, in.UserAgent, in.IP, in.ExpiresAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *RefreshTokenRepository) FindActiveByHash(ctx context.Context, tokenHash []byte) (*ports.RefreshToken, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, token_hash, expires_at, revoked_at
FROM refresh_tokens
WHERE token_hash=$1`
	var out ports.RefreshToken
	err := db.QueryRow(ctx, q, tokenHash).Scan(&out.ID, &out.UserID, &out.TokenHash, &out.ExpiresAt, &out.RevokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if out.RevokedAt != nil || !now.Before(out.ExpiresAt) {
		return nil, domain.ErrUnauthorized
	}
	return &out, nil
}

func (r *RefreshTokenRepository) RevokeByHash(ctx context.Context, tokenHash []byte, revokedAt time.Time) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE refresh_tokens
SET revoked_at=$2
WHERE token_hash=$1 AND revoked_at IS NULL`
	_, err := db.Exec(ctx, q, tokenHash, revokedAt)
	return err
}
