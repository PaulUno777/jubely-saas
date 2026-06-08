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

type WebAuthnChallengeRepository struct {
	Pool *pgxpool.Pool
}

func (r *WebAuthnChallengeRepository) Create(ctx context.Context, c ports.WebAuthnChallenge) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO webauthn_challenges (id, user_id, kind, session_data, expires_at, created_at)
VALUES ($1,$2,$3,$4::jsonb,$5,$6)`
	_, err := db.Exec(ctx, q, c.ID, c.UserID, c.Kind, c.SessionData, c.ExpiresAt, c.CreatedAt)
	return err
}

func (r *WebAuthnChallengeRepository) Find(ctx context.Context, id uuid.UUID) (*ports.WebAuthnChallenge, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, kind, session_data, expires_at, created_at
FROM webauthn_challenges
WHERE id=$1`
	var out ports.WebAuthnChallenge
	err := db.QueryRow(ctx, q, id).Scan(&out.ID, &out.UserID, &out.Kind, &out.SessionData, &out.ExpiresAt, &out.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *WebAuthnChallengeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	const q = `DELETE FROM webauthn_challenges WHERE id=$1`
	_, err := db.Exec(ctx, q, id)
	return err
}
