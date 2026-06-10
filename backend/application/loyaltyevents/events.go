package loyaltyevents

import (
	"time"

	"github.com/google/uuid"
)

const (
	EventPurchaseRecorded       = "PurchaseRecorded"
	EventPointsAwarded          = "PointsAwarded"
	EventTierUpgraded           = "TierUpgraded"
	EventNotificationRequested  = "NotificationRequested"
)

type PurchaseRecorded struct {
	TenantID       uuid.UUID
	EnrollmentID   uuid.UUID
	AmountFcfa     int64
	OccurredAt     time.Time
	IdempotencyKey string
	Source         string
}

func (e PurchaseRecorded) EventName() string { return EventPurchaseRecorded }

type PointsAwarded struct {
	TenantID     uuid.UUID
	EnrollmentID uuid.UUID
	Delta        int
	RuleIDs      []string
}

func (e PointsAwarded) EventName() string { return EventPointsAwarded }

type NotificationRequested struct {
	TenantID       uuid.UUID
	EnrollmentID   uuid.UUID
	Channel        string
	Template       string
	IdempotencyKey string
}

func (e NotificationRequested) EventName() string { return EventNotificationRequested }
