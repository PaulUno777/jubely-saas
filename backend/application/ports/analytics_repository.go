package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AnalyticsDailyRollup struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	LocationID *uuid.UUID
	Day        time.Time
	Metrics    []byte
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type AnalyticsRepository interface {
	GetDailyRollup(ctx context.Context, tenantID uuid.UUID, day time.Time, locationID *uuid.UUID) (*AnalyticsDailyRollup, error)
	UpsertDailyRollup(ctx context.Context, rollup *AnalyticsDailyRollup) error
	ListDailyRollups(ctx context.Context, tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) ([]AnalyticsDailyRollup, error)
}
