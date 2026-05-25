package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StoreCatalog lists enrolled customers and point events for merchant admin views.
type StoreCatalog struct {
	Pool *pgxpool.Pool
}

type StoreCustomerRow struct {
	EnrollmentID  uuid.UUID
	CustomerID    uuid.UUID
	Name          string
	PhoneE164     string
	Email         *string
	Tier          string
	PointsBalance int64
	EnrolledAt    time.Time
}

type StorePointEventRow struct {
	EventID       uuid.UUID
	EventType     string
	Delta         int
	Payload       json.RawMessage
	CreatedAt     time.Time
	CustomerName  *string
	CustomerPhone *string
}

func (r *StoreCatalog) CountCustomers(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM loyalty_enrollments WHERE tenant_id=$1`
	var n int64
	err := db.QueryRow(ctx, q, tenantID).Scan(&n)
	return n, err
}

func (r *StoreCatalog) ListCustomers(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]StoreCustomerRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT
  le.id,
  ci.id,
  ci.name,
  ci.phone,
  ci.email,
  le.tier,
  COALESCE((
    SELECT SUM(pe.delta)::bigint FROM point_events pe WHERE pe.enrollment_id = le.id
  ), 0),
  le.created_at
FROM loyalty_enrollments le
JOIN customer_identities ci ON ci.id = le.customer_id
WHERE le.tenant_id = $1
ORDER BY le.created_at DESC
OFFSET $2 LIMIT $3`
	rows, err := db.Query(ctx, q, tenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StoreCustomerRow
	for rows.Next() {
		var row StoreCustomerRow
		if err := rows.Scan(
			&row.EnrollmentID,
			&row.CustomerID,
			&row.Name,
			&row.PhoneE164,
			&row.Email,
			&row.Tier,
			&row.PointsBalance,
			&row.EnrolledAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *StoreCatalog) EnrollmentPointsBalance(ctx context.Context, enrollmentID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT COALESCE(SUM(delta), 0)::bigint FROM point_events WHERE enrollment_id = $1`
	var balance int64
	err := db.QueryRow(ctx, q, enrollmentID).Scan(&balance)
	return balance, err
}

type EnrollmentPointEventRow struct {
	EventID   uuid.UUID
	EventType string
	Delta     int
	Payload   json.RawMessage
	CreatedAt time.Time
}

func (r *StoreCatalog) ListEventsByEnrollment(ctx context.Context, enrollmentID uuid.UUID, limit int) ([]EnrollmentPointEventRow, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, event_type, delta, payload, created_at
FROM point_events
WHERE enrollment_id = $1
ORDER BY created_at DESC
LIMIT $2`
	rows, err := db.Query(ctx, q, enrollmentID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []EnrollmentPointEventRow
	for rows.Next() {
		var row EnrollmentPointEventRow
		if err := rows.Scan(&row.EventID, &row.EventType, &row.Delta, &row.Payload, &row.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *StoreCatalog) CountPointEvents(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM point_events WHERE tenant_id=$1`
	var n int64
	err := db.QueryRow(ctx, q, tenantID).Scan(&n)
	return n, err
}

func (r *StoreCatalog) ListPointEvents(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]StorePointEventRow, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT
  pe.id,
  pe.event_type,
  pe.delta,
  pe.payload,
  pe.created_at,
  ci.name,
  ci.phone
FROM point_events pe
LEFT JOIN loyalty_enrollments le ON le.id = pe.enrollment_id
LEFT JOIN customer_identities ci ON ci.id = le.customer_id
WHERE pe.tenant_id = $1
ORDER BY pe.created_at DESC
OFFSET $2 LIMIT $3`
	rows, err := db.Query(ctx, q, tenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StorePointEventRow
	for rows.Next() {
		var row StorePointEventRow
		if err := rows.Scan(
			&row.EventID,
			&row.EventType,
			&row.Delta,
			&row.Payload,
			&row.CreatedAt,
			&row.CustomerName,
			&row.CustomerPhone,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}
