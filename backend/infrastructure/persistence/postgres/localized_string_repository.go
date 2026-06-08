package postgres

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LocalizedStringRepository struct {
	Pool *pgxpool.Pool
}

func (r *LocalizedStringRepository) ListByOwner(ctx context.Context, ownerType string, ownerID uuid.UUID) ([]domain.LocalizedString, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, owner_type, owner_id, field_key, locale, value, created_at, updated_at
FROM localized_strings
WHERE owner_type=$1 AND owner_id=$2
ORDER BY field_key ASC, locale ASC`
	rows, err := db.Query(ctx, q, ownerType, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LocalizedString
	for rows.Next() {
		var s domain.LocalizedString
		if err := rows.Scan(&s.ID, &s.OwnerType, &s.OwnerID, &s.FieldKey, &s.Locale, &s.Value, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *LocalizedStringRepository) Upsert(ctx context.Context, s *domain.LocalizedString) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO localized_strings (id, owner_type, owner_id, field_key, locale, value, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (owner_type, owner_id, field_key, locale)
DO UPDATE SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at`
	_, err := db.Exec(ctx, q, s.ID, s.OwnerType, s.OwnerID, s.FieldKey, s.Locale, s.Value, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *LocalizedStringRepository) Delete(ctx context.Context, ownerType string, ownerID uuid.UUID, fieldKey, locale string) error {
	db := pickDB(ctx, r.Pool)
	const q = `
DELETE FROM localized_strings
WHERE owner_type=$1 AND owner_id=$2 AND field_key=$3 AND locale=$4`
	res, err := db.Exec(ctx, q, ownerType, ownerID, fieldKey, locale)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
