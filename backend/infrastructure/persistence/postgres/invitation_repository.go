package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationRepository struct {
	Pool *pgxpool.Pool
}

func (r *InvitationRepository) Create(ctx context.Context, inv *domain.MerchantInvitation) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO merchant_invitations (id, tenant_id, email, role, token_hash, expires_at, accepted_at, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`
	_, err := db.Exec(ctx, q, inv.ID, inv.TenantID, inv.Email, inv.Role.String(), inv.TokenHash, inv.ExpiresAt, inv.AcceptedAt, inv.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *InvitationRepository) FindByTokenHash(ctx context.Context, tokenHash []byte) (*domain.MerchantInvitation, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, email, role::text, token_hash, expires_at, accepted_at, created_at
FROM merchant_invitations WHERE token_hash=$1`
	var inv domain.MerchantInvitation
	var role string
	err := db.QueryRow(ctx, q, tokenHash).Scan(
		&inv.ID, &inv.TenantID, &inv.Email, &role, &inv.TokenHash, &inv.ExpiresAt, &inv.AcceptedAt, &inv.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	inv.Role = domain.Role(role)
	return &inv, nil
}

func (r *InvitationRepository) MarkAccepted(ctx context.Context, invitationID uuid.UUID, at time.Time) error {
	db := pickDB(ctx, r.Pool)
	const q = `UPDATE merchant_invitations SET accepted_at=$2 WHERE id=$1 AND accepted_at IS NULL`
	tag, err := db.Exec(ctx, q, invitationID, at)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrConflict
	}
	return nil
}
