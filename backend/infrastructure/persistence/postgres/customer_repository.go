package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const customerSelectCols = `
id, user_id, phone, name, email, gender, date_of_birth, neighborhood, job_title,
preferred_locale, interests, profile_completed_at, notification_prefs, created_at`

type customerRowScanner interface {
	Scan(dest ...any) error
}

type CustomerRepository struct {
	Pool *pgxpool.Pool
}

func scanCustomer(row customerRowScanner) (*domain.CustomerIdentity, error) {
	var c domain.CustomerIdentity
	var userID *uuid.UUID
	var email *string
	var interests []string
	var notificationPrefs []byte
	err := row.Scan(
		&c.ID, &userID, &c.PhoneE164, &c.Name, &email,
		&c.Gender, &c.DateOfBirth, &c.Neighborhood, &c.JobTitle,
		&c.PreferredLocale, &interests, &c.ProfileCompletedAt, &notificationPrefs, &c.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	c.UserID = userID
	c.Email = email
	c.Interests = interests
	if len(interests) == 0 {
		c.Interests = []string{}
	}
	c.NotificationPrefs = notificationPrefs
	if len(notificationPrefs) == 0 {
		c.NotificationPrefs = []byte("{}")
	}
	return &c, nil
}

func (r *CustomerRepository) Create(ctx context.Context, c *domain.CustomerIdentity) error {
	db := pickDB(ctx, r.Pool)
	interests := c.Interests
	if interests == nil {
		interests = []string{}
	}
	prefs := c.NotificationPrefs
	if len(prefs) == 0 {
		prefs = []byte("{}")
	}
	locale := c.PreferredLocale
	if locale == "" {
		locale = "fr"
	}
	const q = `
INSERT INTO customer_identities (
  id, user_id, phone, name, email, gender, date_of_birth, neighborhood, job_title,
  preferred_locale, interests, profile_completed_at, notification_prefs, created_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
	_, err := db.Exec(ctx, q,
		c.ID, c.UserID, c.PhoneE164, c.Name, c.Email,
		c.Gender, c.DateOfBirth, c.Neighborhood, c.JobTitle,
		locale, interests, c.ProfileCompletedAt, prefs, c.CreatedAt,
	)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *CustomerRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + customerSelectCols + ` FROM customer_identities WHERE id=$1`
	c, err := scanCustomer(db.QueryRow(ctx, q, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CustomerRepository) FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + customerSelectCols + ` FROM customer_identities WHERE phone=$1`
	c, err := scanCustomer(db.QueryRow(ctx, q, phoneE164))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CustomerRepository) FindByEmail(ctx context.Context, email string) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + customerSelectCols + ` FROM customer_identities WHERE lower(email)=lower($1)`
	c, err := scanCustomer(db.QueryRow(ctx, q, email))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CustomerRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*domain.CustomerIdentity, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + customerSelectCols + ` FROM customer_identities WHERE user_id=$1`
	c, err := scanCustomer(db.QueryRow(ctx, q, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
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

func (r *CustomerRepository) UpdateProfile(ctx context.Context, c *domain.CustomerIdentity) error {
	db := pickDB(ctx, r.Pool)
	interests := c.Interests
	if interests == nil {
		interests = []string{}
	}
	prefs := c.NotificationPrefs
	if len(prefs) == 0 {
		prefs = []byte("{}")
	}
	locale := c.PreferredLocale
	if locale == "" {
		locale = "fr"
	}
	const q = `
UPDATE customer_identities
SET name=$2, email=$3, gender=$4, date_of_birth=$5, neighborhood=$6, job_title=$7,
    preferred_locale=$8, interests=$9, profile_completed_at=$10, notification_prefs=$11
WHERE id=$1`
	res, err := db.Exec(ctx, q,
		c.ID, c.Name, c.Email, c.Gender, c.DateOfBirth, c.Neighborhood, c.JobTitle,
		locale, interests, c.ProfileCompletedAt, prefs,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
