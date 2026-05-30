package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RewardRepository struct {
	Pool *pgxpool.Pool
}

func (r *RewardRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]domain.Reward, error) {
	db := pickDB(ctx, r.Pool)
	q := `
SELECT id, tenant_id, name, description, point_cost, min_tier, active, stock_limit, created_at, updated_at
FROM rewards WHERE tenant_id=$1`
	if activeOnly {
		q += ` AND active=true`
	}
	q += ` ORDER BY point_cost ASC, name ASC`
	rows, err := db.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Reward
	for rows.Next() {
		var rw domain.Reward
		if err := rows.Scan(&rw.ID, &rw.TenantID, &rw.Name, &rw.Description, &rw.PointCost, &rw.MinTier, &rw.Active, &rw.StockLimit, &rw.CreatedAt, &rw.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, rw)
	}
	return out, rows.Err()
}

func (r *RewardRepository) FindByID(ctx context.Context, tenantID, rewardID uuid.UUID) (*domain.Reward, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, name, description, point_cost, min_tier, active, stock_limit, created_at, updated_at
FROM rewards WHERE tenant_id=$1 AND id=$2`
	var rw domain.Reward
	err := db.QueryRow(ctx, q, tenantID, rewardID).Scan(
		&rw.ID, &rw.TenantID, &rw.Name, &rw.Description, &rw.PointCost, &rw.MinTier, &rw.Active, &rw.StockLimit, &rw.CreatedAt, &rw.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &rw, nil
}

func (r *RewardRepository) Create(ctx context.Context, rw *domain.Reward) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO rewards (id, tenant_id, name, description, point_cost, min_tier, active, stock_limit, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`
	_, err := db.Exec(ctx, q, rw.ID, rw.TenantID, rw.Name, rw.Description, rw.PointCost, rw.MinTier, rw.Active, rw.StockLimit, rw.CreatedAt, rw.UpdatedAt)
	return err
}

func (r *RewardRepository) Update(ctx context.Context, rw *domain.Reward) error {
	db := pickDB(ctx, r.Pool)
	const q = `
UPDATE rewards SET name=$3, description=$4, point_cost=$5, min_tier=$6, active=$7, stock_limit=$8, updated_at=$9
WHERE tenant_id=$1 AND id=$2`
	res, err := db.Exec(ctx, q, rw.TenantID, rw.ID, rw.Name, rw.Description, rw.PointCost, rw.MinTier, rw.Active, rw.StockLimit, rw.UpdatedAt)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type RedemptionRepository struct {
	Pool *pgxpool.Pool
}

func (r *RedemptionRepository) Create(ctx context.Context, rd *domain.Redemption) error {
	db := pickDB(ctx, r.Pool)
	const q = `
INSERT INTO redemptions (id, tenant_id, enrollment_id, reward_id, points_spent, status, claim_qr, display_code, expires_at, burned_at, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
	_, err := db.Exec(ctx, q,
		rd.ID, rd.TenantID, rd.EnrollmentID, rd.RewardID, rd.PointsSpent, string(rd.Status),
		rd.ClaimQR, rd.DisplayCode, rd.ExpiresAt, rd.BurnedAt, rd.CreatedAt,
	)
	return err
}

func (r *RedemptionRepository) FindByClaimQR(ctx context.Context, claimQR string) (*domain.Redemption, error) {
	db := pickDB(ctx, r.Pool)
	const q = `
SELECT id, tenant_id, enrollment_id, reward_id, points_spent, status, claim_qr, display_code, expires_at, burned_at, created_at
FROM redemptions WHERE claim_qr=$1`
	var rd domain.Redemption
	var status string
	err := db.QueryRow(ctx, q, claimQR).Scan(
		&rd.ID, &rd.TenantID, &rd.EnrollmentID, &rd.RewardID, &rd.PointsSpent, &status,
		&rd.ClaimQR, &rd.DisplayCode, &rd.ExpiresAt, &rd.BurnedAt, &rd.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	rd.Status = domain.RedemptionStatus(status)
	return &rd, nil
}

func (r *RedemptionRepository) MarkBurned(ctx context.Context, id uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	const q = `UPDATE redemptions SET status='burned', burned_at=$2 WHERE id=$1 AND status='pending'`
	res, err := db.Exec(ctx, q, id, time.Now().UTC())
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *RedemptionRepository) CountClaimedByReward(ctx context.Context, rewardID uuid.UUID) (int64, error) {
	db := pickDB(ctx, r.Pool)
	const q = `SELECT COUNT(*) FROM redemptions WHERE reward_id=$1 AND status IN ('pending','burned')`
	var n int64
	err := db.QueryRow(ctx, q, rewardID).Scan(&n)
	return n, err
}
