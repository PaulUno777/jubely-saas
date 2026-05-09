package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerRepository struct {
	Pool *pgxpool.Pool
}

func (r *CustomerRepository) Create(ctx context.Context, c *domain.CustomerIdentity) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO customer_identities (id, phone, name, email, created_at)
VALUES ($1,$2,$3,$4,$5)`
	_, err := db.Exec(ctx, q, c.ID, c.PhoneE164, c.Name, c.Email, c.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *CustomerRepository) FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, phone, name, email, created_at
FROM customer_identities
WHERE phone=$1`
	var c domain.CustomerIdentity
	var email *string
	err := db.QueryRow(ctx, q, phoneE164).Scan(&c.ID, &c.PhoneE164, &c.Name, &email, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	c.Email = email
	return &c, nil
}
