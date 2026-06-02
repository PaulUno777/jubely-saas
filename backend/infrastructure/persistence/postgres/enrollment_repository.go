package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EnrollmentRepository struct {
	Pool *pgxpool.Pool
}

func (r *EnrollmentRepository) Create(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO loyalty_enrollments (id, tenant_id, customer_id, tier, home_store_id, created_at)
VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := db.Exec(ctx, q, e.ID, e.TenantID, e.CustomerID, e.Tier, e.HomeStoreID, e.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *EnrollmentRepository) FindByTenantAndCustomer(ctx context.Context, tenantID uuid.UUID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, customer_id, tier, home_store_id, created_at
FROM loyalty_enrollments
WHERE tenant_id=$1 AND customer_id=$2`
	var e domain.LoyaltyEnrollment
	err := db.QueryRow(ctx, q, tenantID, customerID).Scan(&e.ID, &e.TenantID, &e.CustomerID, &e.Tier, &e.HomeStoreID, &e.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EnrollmentRepository) FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, customer_id, tier, home_store_id, created_at
FROM loyalty_enrollments
WHERE id=$1`
	var e domain.LoyaltyEnrollment
	err := db.QueryRow(ctx, q, enrollmentID).Scan(&e.ID, &e.TenantID, &e.CustomerID, &e.Tier, &e.HomeStoreID, &e.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EnrollmentRepository) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, customer_id, tier, home_store_id, created_at
FROM loyalty_enrollments
WHERE customer_id=$1
ORDER BY created_at DESC`
	rows, err := db.Query(ctx, q, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LoyaltyEnrollment
	for rows.Next() {
		var e domain.LoyaltyEnrollment
		if err := rows.Scan(&e.ID, &e.TenantID, &e.CustomerID, &e.Tier, &e.HomeStoreID, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
