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
INSERT INTO stores (id, organization_id, slug, name, country_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`
	_, err := db.Exec(ctx, q,
		s.ID, s.OrganizationID, s.Slug, s.Name, s.CountryCode, s.City, s.AddressLine,
		s.Lat, s.Lng, string(s.Status), s.IsHQ, s.Timezone, s.Settings, s.CreatedAt, s.UpdatedAt,
	)
	return err
}

func (r *StoreRepository) Update(ctx context.Context, s *domain.Store) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE stores SET slug=$3, name=$4, country_code=$5, city=$6, address_line=$7, lat=$8, lng=$9,
    status=$10, timezone=$11, settings=$12, updated_at=$13
WHERE organization_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q,
		s.OrganizationID, s.ID, s.Slug, s.Name, s.CountryCode, s.City, s.AddressLine,
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

func (r *StoreRepository) FindByID(ctx context.Context, organizationID, storeID uuid.UUID) (*domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	return scanStore(db.QueryRow(ctx, `
SELECT id, organization_id, slug, name, country_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM stores WHERE organization_id=$1 AND id=$2`, organizationID, storeID))
}

func (r *StoreRepository) FindHQ(ctx context.Context, organizationID uuid.UUID) (*domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	return scanStore(db.QueryRow(ctx, `
SELECT id, organization_id, slug, name, country_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM stores WHERE organization_id=$1 AND is_hq=true LIMIT 1`, organizationID))
}

func (r *StoreRepository) ListByOrganization(ctx context.Context, organizationID uuid.UUID) ([]domain.Store, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT id, organization_id, slug, name, country_code, city, address_line, lat, lng, status, is_hq, timezone, settings, created_at, updated_at
FROM stores WHERE organization_id=$1 ORDER BY is_hq DESC, name ASC`, organizationID)
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
	err := db.QueryRow(ctx, `SELECT COUNT(*) FROM stores WHERE organization_id=$1`, organizationID).Scan(&n)
	return n, err
}

func scanStore(row pgx.Row) (*domain.Store, error) {
	var s domain.Store
	var status string
	err := row.Scan(
		&s.ID, &s.OrganizationID, &s.Slug, &s.Name, &s.CountryCode, &s.City, &s.AddressLine,
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
		&s.ID, &s.OrganizationID, &s.Slug, &s.Name, &s.CountryCode, &s.City, &s.AddressLine,
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
INSERT INTO store_memberships (id, user_id, store_id) VALUES ($1,$2,$3)
ON CONFLICT (user_id, store_id) DO NOTHING`, uuid.New(), userID, storeID)
	return err
}

func (r *StoreMembershipRepository) ListStoreIDsForUserInOrg(ctx context.Context, userID, organizationID uuid.UUID) ([]uuid.UUID, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `
SELECT sm.store_id FROM store_memberships sm
JOIN stores s ON s.id = sm.store_id
WHERE sm.user_id=$1 AND s.organization_id=$2`, userID, organizationID)
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
    SELECT sm.user_id FROM store_memberships sm
    JOIN stores s ON s.id = sm.store_id WHERE s.organization_id=$1
) u`, organizationID).Scan(&n)
	return n, err
}

type RewardStoreAvailabilityRepository struct {
	Pool *pgxpool.Pool
}

func (r *RewardStoreAvailabilityRepository) SetForReward(ctx context.Context, rewardID uuid.UUID, storeIDs []uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	_, err := db.Exec(ctx, `DELETE FROM reward_store_availability WHERE reward_id=$1`, rewardID)
	if err != nil {
		return err
	}
	for _, sid := range storeIDs {
		_, err := db.Exec(ctx, `
INSERT INTO reward_store_availability (reward_id, store_id) VALUES ($1,$2)
ON CONFLICT DO NOTHING`, rewardID, sid)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *RewardStoreAvailabilityRepository) ListStoreIDsForReward(ctx context.Context, rewardID uuid.UUID) ([]uuid.UUID, error) {
	db := pickDB(ctx, r.Pool)
	rows, err := db.Query(ctx, `SELECT store_id FROM reward_store_availability WHERE reward_id=$1`, rewardID)
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
SELECT s.id, s.name, s.slug, s.address_line, s.city, s.country_code
FROM reward_store_availability rsa
JOIN stores s ON s.id = rsa.store_id
WHERE rsa.reward_id=$1
ORDER BY s.name`, rewardID)
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
