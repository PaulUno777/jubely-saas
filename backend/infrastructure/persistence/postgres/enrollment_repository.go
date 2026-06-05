package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const enrollmentSelectCols = `
le.id, le.tenant_id, le.customer_id, le.tier, le.tier_id, le.home_location_id,
le.enrollment_source, le.enrollment_location_id, le.last_interaction_at, le.last_interaction_location_id,
le.lifetime_spend_fcfa, le.visit_count, le.status, le.created_at`

type enrollmentRowScanner interface {
	Scan(dest ...any) error
}

type EnrollmentRepository struct {
	Pool *pgxpool.Pool
}

func scanEnrollment(row enrollmentRowScanner) (*domain.LoyaltyEnrollment, error) {
	var e domain.LoyaltyEnrollment
	err := row.Scan(
		&e.ID, &e.TenantID, &e.CustomerID, &e.Tier, &e.TierID, &e.HomeStoreID,
		&e.EnrollmentSource, &e.EnrollmentLocationID, &e.LastInteractionAt, &e.LastInteractionLocationID,
		&e.LifetimeSpendFcfa, &e.VisitCount, &e.Status, &e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if e.EnrollmentSource == "" {
		e.EnrollmentSource = domain.EnrollmentSourceUnknown
	}
	if e.Status == "" {
		e.Status = domain.EnrollmentStatusActive.String()
	}
	return &e, nil
}

func (r *EnrollmentRepository) Create(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	db := pickDB(ctx, r.Pool)
	source := e.EnrollmentSource
	if source == "" {
		source = domain.EnrollmentSourceUnknown
	}
	status := e.Status
	if status == "" {
		status = domain.EnrollmentStatusActive.String()
	}
	const q = `
INSERT INTO loyalty_enrollments (
  id, tenant_id, customer_id, tier, tier_id, home_location_id,
  enrollment_source, enrollment_location_id, last_interaction_at, last_interaction_location_id,
  lifetime_spend_fcfa, visit_count, status, created_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
	_, err := db.Exec(ctx, q,
		e.ID, e.TenantID, e.CustomerID, e.Tier, e.TierID, e.HomeStoreID,
		source, e.EnrollmentLocationID, e.LastInteractionAt, e.LastInteractionLocationID,
		e.LifetimeSpendFcfa, e.VisitCount, status, e.CreatedAt,
	)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *EnrollmentRepository) Update(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	db := pickDB(ctx, r.Pool)
	status := e.Status
	if status == "" {
		status = domain.EnrollmentStatusActive.String()
	}
	source := e.EnrollmentSource
	if source == "" {
		source = domain.EnrollmentSourceUnknown
	}
	const q = `
UPDATE loyalty_enrollments
SET tier=$2, tier_id=$3, home_location_id=$4, enrollment_source=$5, enrollment_location_id=$6,
    last_interaction_at=$7, last_interaction_location_id=$8, lifetime_spend_fcfa=$9, visit_count=$10, status=$11
WHERE id=$1`
	res, err := db.Exec(ctx, q,
		e.ID, e.Tier, e.TierID, e.HomeStoreID, source, e.EnrollmentLocationID,
		e.LastInteractionAt, e.LastInteractionLocationID, e.LifetimeSpendFcfa, e.VisitCount, status,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *EnrollmentRepository) FindByTenantAndCustomer(ctx context.Context, tenantID uuid.UUID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + enrollmentSelectCols + ` FROM loyalty_enrollments le WHERE le.tenant_id=$1 AND le.customer_id=$2`
	e, err := scanEnrollment(db.QueryRow(ctx, q, tenantID, customerID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *EnrollmentRepository) FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + enrollmentSelectCols + ` FROM loyalty_enrollments le WHERE le.id=$1`
	e, err := scanEnrollment(db.QueryRow(ctx, q, enrollmentID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *EnrollmentRepository) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + enrollmentSelectCols + ` FROM loyalty_enrollments le WHERE le.customer_id=$1 ORDER BY le.created_at DESC`
	rows, err := db.Query(ctx, q, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LoyaltyEnrollment
	for rows.Next() {
		e, err := scanEnrollment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *EnrollmentRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, filter ports.EnrollmentListFilter) ([]domain.LoyaltyEnrollment, error) {
	db := pickDB(ctx, r.Pool)
	q := `SELECT ` + enrollmentSelectCols + ` FROM loyalty_enrollments le`
	args := []any{tenantID}
	where := []string{"le.tenant_id=$1"}

	if filter.Status != nil && *filter.Status != "" {
		args = append(args, *filter.Status)
		where = append(where, fmt.Sprintf("le.status=$%d", len(args)))
	}
	if filter.TierID != nil {
		args = append(args, *filter.TierID)
		where = append(where, fmt.Sprintf("le.tier_id=$%d", len(args)))
	}
	if filter.LocationID != nil {
		args = append(args, *filter.LocationID)
		where = append(where, fmt.Sprintf("le.home_location_id=$%d", len(args)))
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		q += ` JOIN customer_identities ci ON ci.id = le.customer_id`
		args = append(args, "%"+search+"%")
		p := len(args)
		where = append(where, fmt.Sprintf("(ci.name ILIKE $%d OR ci.phone ILIKE $%d OR ci.email ILIKE $%d)", p, p, p))
	}

	q += ` WHERE ` + strings.Join(where, " AND ")
	q += ` ORDER BY le.created_at DESC`

	if filter.Offset > 0 {
		args = append(args, filter.Offset)
		q += fmt.Sprintf(" OFFSET $%d", len(args))
	}
	if filter.Limit > 0 {
		args = append(args, filter.Limit)
		q += fmt.Sprintf(" LIMIT $%d", len(args))
	}

	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LoyaltyEnrollment
	for rows.Next() {
		e, err := scanEnrollment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *EnrollmentRepository) UpdateInteraction(ctx context.Context, enrollmentID uuid.UUID, at time.Time, locationID *uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE loyalty_enrollments
SET last_interaction_at=$2, last_interaction_location_id=$3, visit_count=visit_count+1
WHERE id=$1`
	res, err := db.Exec(ctx, q, enrollmentID, at, locationID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
