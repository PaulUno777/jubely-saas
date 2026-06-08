package postgres

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StoreRepository struct {
	Pool *pgxpool.Pool
}

func (r *StoreRepository) Create(ctx context.Context, s *domain.Store) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO locations (id, tenant_id, slug, name, country_code, state_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`
	_, err := db.Exec(ctx, q,
		s.ID, s.TenantID, s.Slug, s.Name, s.CountryCode, s.StateCode, s.City, s.AddressLine,
		s.Lat, s.Lng, string(s.Status), s.IsHQ, s.Timezone, s.Settings, s.CreatedAt, s.UpdatedAt,
	)
	return err
}

func (r *StoreRepository) Update(ctx context.Context, s *domain.Store) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE locations SET slug=$3, name=$4, country_code=$5, state_code=$6, city=$7, address_line=$8, lat=$9, lng=$10,
    status=$11, timezone=$12, settings=$13, updated_at=$14
WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q,
		s.TenantID, s.ID, s.Slug, s.Name, s.CountryCode, s.StateCode, s.City, s.AddressLine,
		s.Lat, s.Lng, string(s.Status), s.Timezone, s.Settings, s.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *StoreRepository) SetAsHQ(ctx context.Context, tenantID, locationID uuid.UUID) (*domain.Store, error) {
	tx, err := r.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	txCtx := withTx(ctx, tx)
	if _, err := tx.Exec(txCtx, `UPDATE locations SET is_hq=false WHERE tenant_id=$1`, tenantID); err != nil {
		return nil, err
	}
	res, err := tx.Exec(txCtx, `
UPDATE locations SET is_hq=true, updated_at=now()
WHERE tenant_id=$1 AND id=$2`, tenantID, locationID)
	if err != nil {
		return nil, err
	}
	if res.RowsAffected() == 0 {
		return nil, domain.ErrNotFound
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.FindByID(ctx, tenantID, locationID)
}

func (r *StoreRepository) FindByID(ctx context.Context, organizationID, storeID uuid.UUID) (*domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	return scanStore(db.QueryRow(ctx, `
SELECT id, tenant_id, slug, name, country_code, state_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM locations WHERE tenant_id=$1 AND id=$2`, organizationID, storeID))
}

func (r *StoreRepository) FindHQ(ctx context.Context, organizationID uuid.UUID) (*domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	return scanStore(db.QueryRow(ctx, `
SELECT id, tenant_id, slug, name, country_code, state_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM locations WHERE tenant_id=$1 AND is_hq=true LIMIT 1`, organizationID))
}

func (r *StoreRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID) ([]domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT id, tenant_id, slug, name, country_code, state_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM locations WHERE tenant_id=$1 ORDER BY is_hq DESC, name ASC`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Store
	for rows.Next() {
		s, err := scanStoreRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *s)
	}
	return out, rows.Err()
}

func (r *StoreRepository) CountByOrganization(ctx context.Context, organizationID uuid.UUID) (int, error) {
	db := pickDB(ctx, r.Pool)
	var n int
	err := db.QueryRow(ctx, `SELECT COUNT(*) FROM locations WHERE tenant_id=$1`, organizationID).Scan(&n)
	return n, err
}

func scanStore(row pgx.Row) (*domain.Store, error) {
	var s domain.Store
	var status string
	err := row.Scan(
		&s.ID, &s.TenantID, &s.Slug, &s.Name, &s.CountryCode, &s.StateCode, &s.City, &s.AddressLine,
		&s.Lat, &s.Lng, &status, &s.IsHQ, &s.Timezone, &s.Settings, &s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	s.Status = domain.StoreStatus(status)
	return &s, nil
}

func scanStoreRow(rows pgx.Rows) (*domain.Store, error) {
	var s domain.Store
	var status string
	err := rows.Scan(
		&s.ID, &s.TenantID, &s.Slug, &s.Name, &s.CountryCode, &s.StateCode, &s.City, &s.AddressLine,
		&s.Lat, &s.Lng, &status, &s.IsHQ, &s.Timezone, &s.Settings, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	s.Status = domain.StoreStatus(status)
	return &s, nil
}

type StoreMembershipRepository struct {
	Pool *pgxpool.Pool
}

func (r *StoreMembershipRepository) Add(ctx context.Context, userID, storeID uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	_, err := db.Exec(ctx, `
INSERT INTO location_memberships (id, user_id, location_id) VALUES ($1,$2,$3)
ON CONFLICT (user_id, location_id) DO NOTHING`, uuid.New(), userID, storeID)
	return err
}

func (r *StoreMembershipRepository) ListStoreIDsForUserInOrg(ctx context.Context, userID, organizationID uuid.UUID) ([]uuid.UUID, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT lm.location_id FROM location_memberships lm
JOIN locations l ON l.id = lm.location_id
WHERE lm.user_id=$1 AND l.tenant_id=$2`, userID, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *StoreMembershipRepository) CountDistinctAgentsInOrg(ctx context.Context, organizationID uuid.UUID) (int, error) {
	db := pickDB(ctx, r.Pool)
	var n int
	err := db.QueryRow(ctx, `
SELECT COUNT(DISTINCT u.id) FROM (
    SELECT user_id FROM tenant_memberships WHERE tenant_id=$1 AND role='staff' AND status='active'
    UNION
    SELECT lm.user_id FROM location_memberships lm
    JOIN locations l ON l.id = lm.location_id WHERE l.tenant_id=$1
) u`, organizationID).Scan(&n)
	return n, err
}

type RewardStoreAvailabilityRepository struct {
	Pool *pgxpool.Pool
}

func (r *RewardStoreAvailabilityRepository) SetForReward(ctx context.Context, rewardID uuid.UUID, storeIDs []uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	_, err := db.Exec(ctx, `DELETE FROM reward_location_availability WHERE reward_id=$1`, rewardID)
	if err != nil {
		return err
	}
	for _, sid := range storeIDs {
		_, err := db.Exec(ctx, `
INSERT INTO reward_location_availability (reward_id, location_id) VALUES ($1,$2)
ON CONFLICT DO NOTHING`, rewardID, sid)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *RewardStoreAvailabilityRepository) ListStoreIDsForReward(ctx context.Context, rewardID uuid.UUID) ([]uuid.UUID, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `SELECT location_id FROM reward_location_availability WHERE reward_id=$1`, rewardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *RewardStoreAvailabilityRepository) ListFulfillmentStoresForReward(ctx context.Context, rewardID uuid.UUID) ([]domain.FulfillmentStore, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT l.id, l.name, l.slug, l.address_line, l.city, l.country_code
FROM reward_location_availability rla
JOIN locations l ON l.id = rla.location_id
WHERE rla.reward_id=$1
ORDER BY l.name`, rewardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.FulfillmentStore
	for rows.Next() {
		var fs domain.FulfillmentStore
		var slug string
		if err := rows.Scan(&fs.ID, &fs.Name, &slug, &fs.AddressLine, &fs.City, &fs.CountryCode); err != nil {
			return nil, err
		}
		fs.Short = slug
		out = append(out, fs)
	}
	return out, rows.Err()
}
