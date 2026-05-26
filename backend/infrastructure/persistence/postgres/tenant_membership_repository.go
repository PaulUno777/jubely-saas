package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantMembershipRepository struct {
	Pool *pgxpool.Pool
}

type membershipScanner interface {
	Scan(dest ...any) error
}

func scanMembership(row membershipScanner) (*domain.TenantMembership, error) {
	var m domain.TenantMembership
	var role string
	var status string
	var perms []byte
	err := row.Scan(&m.ID, &m.UserID, &m.TenantID, &role, &perms, &status, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	m.Role = domain.Role(role)
	m.Status = domain.MembershipStatus(status)
	if len(perms) > 0 {
		m.Permissions = json.RawMessage(append([]byte(nil), perms...))
	} else {
		m.Permissions = json.RawMessage(`[]`)
	}
	return &m, nil
}

func (r *TenantMembershipRepository) Create(ctx context.Context, m *domain.TenantMembership) error {
	db := pickDB(ctx, r.Pool)
	perms := m.Permissions
	if len(perms) == 0 {
		perms = json.RawMessage(`[]`)
	}
	status := m.Status
	if status == "" {
		status = domain.MembershipStatusActive
	}
	const q = `
INSERT INTO tenant_memberships (id, user_id, tenant_id, role, permissions, status, created_at)
VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`
	_, err := db.Exec(ctx, q, m.ID, m.UserID, m.TenantID, m.Role.String(), []byte(perms), string(status), m.CreatedAt)
	if err != nil && isUniqueViolation(err) {
		return domain.ErrConflict
	}
	return err
}

func (r *TenantMembershipRepository) FindByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) (*domain.TenantMembership, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, tenant_id, role::text, permissions, status::text, created_at
FROM tenant_memberships
WHERE user_id=$1 AND tenant_id=$2`
	m, err := scanMembership(db.QueryRow(ctx, q, userID, tenantID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (r *TenantMembershipRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.TenantMembership, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, tenant_id, role::text, permissions, status::text, created_at
FROM tenant_memberships
WHERE id=$1`
	m, err := scanMembership(db.QueryRow(ctx, q, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (r *TenantMembershipRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.TenantMembership, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, user_id, tenant_id, role::text, permissions, status::text, created_at
FROM tenant_memberships
WHERE user_id=$1
ORDER BY created_at ASC`
	rows, err := db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.TenantMembership
	for rows.Next() {
		row, err := scanMembership(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *row)
	}
	return out, rows.Err()
}

func parsePerms(raw []byte, role domain.Role) []string {
	if len(raw) == 0 {
		return domain.DefaultPermissionsForRole(role)
	}
	var perms []string
	if err := json.Unmarshal(raw, &perms); err != nil || len(perms) == 0 {
		return domain.DefaultPermissionsForRole(role)
	}
	return perms
}

func (r *TenantMembershipRepository) ListWorkspaceSummariesByUser(ctx context.Context, userID uuid.UUID) ([]domain.WorkspaceSummary, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT tm.id, tm.tenant_id, t.name, t.slug, tm.role::text, tm.permissions
FROM tenant_memberships tm
JOIN tenants t ON t.id = tm.tenant_id
WHERE tm.user_id=$1 AND tm.status='active' AND t.active=true
ORDER BY tm.created_at ASC`
	rows, err := db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.WorkspaceSummary
	for rows.Next() {
		var row domain.WorkspaceSummary
		var role string
		var perms []byte
		if err := rows.Scan(&row.MembershipID, &row.TenantID, &row.TenantName, &row.TenantSlug, &role, &perms); err != nil {
			return nil, err
		}
		row.Role = domain.Role(role)
		row.Permissions = parsePerms(perms, row.Role)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *TenantMembershipRepository) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT count(*) FROM tenant_memberships WHERE tenant_id=$1`
	var n int64
	if err := db.QueryRow(ctx, q, tenantID).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

func (r *TenantMembershipRepository) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT u.id, u.email, tm.role::text, tm.created_at
FROM tenant_memberships tm
JOIN users u ON u.id = tm.user_id
WHERE tm.tenant_id=$1
ORDER BY tm.created_at DESC
OFFSET $2 LIMIT $3`
	rows, err := db.Query(ctx, q, tenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.UserPublic
	for rows.Next() {
		var row domain.UserPublic
		var role string
		if err := rows.Scan(&row.ID, &row.Email, &role, &row.CreatedAt); err != nil {
			return nil, err
		}
		row.Role = domain.Role(role)
		out = append(out, row)
	}
	return out, rows.Err()
}
