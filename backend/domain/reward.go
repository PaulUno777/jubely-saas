package domain

import (
	"time"

	"github.com/google/uuid"
)

type Reward struct {
	ID          uuid.UUID
	TenantID    uuid.UUID
	Name        string
	Description string
	PointCost   int
	MinTier     string
	Active      bool
	StockLimit  *int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type RedemptionStatus string

const (
	RedemptionPending RedemptionStatus = "pending"
	RedemptionBurned  RedemptionStatus = "burned"
	RedemptionExpired RedemptionStatus = "expired"
)

type Redemption struct {
	ID                 uuid.UUID
	TenantID           uuid.UUID
	EnrollmentID       uuid.UUID
	RewardID           uuid.UUID
	PointsSpent        int
	Status             RedemptionStatus
	ClaimQR            string
	DisplayCode        string
	ExpiresAt          time.Time
	BurnedAt           *time.Time
	FulfillmentStores  []FulfillmentStore
	CreatedAt          time.Time
}
