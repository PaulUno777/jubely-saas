package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerRepository struct {
	Pool *pgxpool.Pool
}

func (r *CustomerRepository) Create(ctx context.Context, c *domain.CustomerIdentity) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO customer_identities (id, user_id, phone, name, email, created_at)
VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := db.Exec(ctx, q, c.ID, c.UserID, c.PhoneE164, c.Name, c.Email, c.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *CustomerRepository) FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, phone, name, email, created_at
FROM customer_identities
WHERE phone=$1`
	var c domain.CustomerIdentity
	var userID *uuid.UUID
	var email *string
	err := db.QueryRow(ctx, q, phoneE164).Scan(&c.ID, &userID, &c.PhoneE164, &c.Name, &email, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	c.UserID = userID
	c.Email = email
	return &c, nil
}

func (r *CustomerRepository) FindByEmail(ctx context.Context, email string) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, phone, name, email, created_at
FROM customer_identities
WHERE lower(email)=lower($1)`
	var c domain.CustomerIdentity
	var userID *uuid.UUID
	var outEmail *string
	err := db.QueryRow(ctx, q, email).Scan(&c.ID, &userID, &c.PhoneE164, &c.Name, &outEmail, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	c.UserID = userID
	c.Email = outEmail
	return &c, nil
}

func (r *CustomerRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, phone, name, email, created_at
FROM customer_identities
WHERE user_id=$1`
	var c domain.CustomerIdentity
	var linkedUserID *uuid.UUID
	var email *string
	err := db.QueryRow(ctx, q, userID).Scan(&c.ID, &linkedUserID, &c.PhoneE164, &c.Name, &email, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	c.UserID = linkedUserID
	c.Email = email
	return &c, nil
}

func (r *CustomerRepository) AssignUser(ctx context.Context, customerID, userID uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE customer_identities
SET user_id=$2
WHERE id=$1`
	res, err := db.Exec(ctx, q, customerID, userID)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
