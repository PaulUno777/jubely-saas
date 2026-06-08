package loyalty

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

const claimTTL = 15 * time.Minute

type CustomerClaimReward struct {
	Tx              ports.TxManager
	QRCodec         ports.QRCodec
	Rewards         ports.RewardRepository
	RewardStores    ports.RewardStoreAvailabilityRepository
	Redemptions     ports.RedemptionRepository
	Enrollments     ports.LoyaltyEnrollmentRepository
	Balances        ports.EnrollmentBalanceReader
	Points          ports.PointEventWriter
	Clock           ports.Clock
}

type CustomerClaimRewardInput struct {
	EnrollmentID uuid.UUID
	RewardID     uuid.UUID
}

type CustomerClaimRewardOutput struct {
	RedemptionID       uuid.UUID
	ClaimQR            string
	DisplayCode        string
	ExpiresAt          time.Time
	PointsSpent        int
	BalanceAfter       int64
	RewardName         string
	FulfillmentStores  []domain.FulfillmentStore
}

func (uc *CustomerClaimReward) Execute(ctx context.Context, in CustomerClaimRewardInput) (*CustomerClaimRewardOutput, error) {
	enr, err := uc.Enrollments.FindByID(ctx, in.EnrollmentID)
	if err != nil {
		return nil, err
	}
	rw, err := uc.Rewards.FindByID(ctx, enr.TenantID, in.RewardID)
	if err != nil {
		return nil, err
	}
	if !rw.Active {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if rw.StockLimit != nil {
		n, err := uc.Redemptions.CountClaimedByReward(ctx, rw.ID)
		if err != nil {
			return nil, err
		}
		if n >= int64(*rw.StockLimit) {
			return nil, domain.ErrConflict
		}
	}

	var out *CustomerClaimRewardOutput
	err = uc.Tx.WithinTx(ctx, func(txCtx context.Context) error {
		balance, err := uc.Balances.EnrollmentPointsBalance(txCtx, enr.ID)
		if err != nil {
			return err
		}
		if balance < int64(rw.PointCost) {
			return domain.ErrConflict
		}
		now := uc.Clock.Now().UTC()
		rdID := uuid.New()
		claimQR, err := uc.QRCodec.SignClaimQR(txCtx, rdID)
		if err != nil {
			return err
		}
		displayCode, err := newRedemptionDisplayCode()
		if err != nil {
			return err
		}
		expires := now.Add(claimTTL)
		var fulfillment []domain.FulfillmentStore
		if uc.RewardStores != nil {
			fulfillment, err = uc.RewardStores.ListFulfillmentStoresForReward(txCtx, rw.ID)
			if err != nil {
				return err
			}
		}
		rd := &domain.Redemption{
			ID:                rdID,
			TenantID:          enr.TenantID,
			EnrollmentID:      enr.ID,
			RewardID:          rw.ID,
			PointsSpent:       rw.PointCost,
			Status:            domain.RedemptionPending,
			ClaimQR:           claimQR,
			DisplayCode:       displayCode,
			ExpiresAt:         expires,
			FulfillmentStores: fulfillment,
			CreatedAt:         now,
		}
		if err := uc.Redemptions.Create(txCtx, rd); err != nil {
			return err
		}
		payload, _ := json.Marshal(map[string]any{
			"reward_id":    rw.ID.String(),
			"reward_name":  rw.Name,
			"display_code": displayCode,
		})
		if err := uc.Points.Append(txCtx, enr.TenantID, nil, &enr.ID, "redeem", -rw.PointCost, payload); err != nil {
			return err
		}
		out = &CustomerClaimRewardOutput{
			RedemptionID:      rdID,
			ClaimQR:           claimQR,
			DisplayCode:       displayCode,
			ExpiresAt:         expires,
			PointsSpent:       rw.PointCost,
			BalanceAfter:      balance - int64(rw.PointCost),
			RewardName:        rw.Name,
			FulfillmentStores: fulfillment,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

func newRedemptionDisplayCode() (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var sb strings.Builder
	sb.WriteString("JBL-")
	for i := 0; i < 4; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		sb.WriteByte(alphabet[n.Int64()])
	}
	sb.WriteByte('-')
	for i := 0; i < 2; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		sb.WriteByte(byte('0' + n.Int64()))
	}
	return sb.String(), nil
}
