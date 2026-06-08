package ports

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type TenantSupportedLocaleRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]domain.TenantSupportedLocale, error)
	ReplaceForTenant(ctx context.Context, tenantID uuid.UUID, locales []domain.TenantSupportedLocale) error
}

type TenantAnalyticsRepository interface {
	Overview(ctx context.Context, in AnalyticsDateRange) (AnalyticsOverview, error)
	MemberGrowth(ctx context.Context, in AnalyticsDateRange) ([]MemberGrowthPoint, error)
	TierDistribution(ctx context.Context, in AnalyticsDateRange) ([]TierDistributionSlice, error)
	HourlyHeatmap(ctx context.Context, in AnalyticsDateRange) ([]HeatmapCell, error)
	TopRewards(ctx context.Context, in AnalyticsDateRange, limit int) ([]TopRewardRow, error)
	RetentionCohorts(ctx context.Context, in AnalyticsDateRange) ([]RetentionCohortRow, error)
}

type AnalyticsDateRange struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

type AnalyticsOverview struct {
	VisitFrequencyPerWeek float64
	AvgBasketFcfa         int64
	PointsPerMember       float64
	DormantMembers        int64
	TotalMembers          int64
}

type MemberGrowthPoint struct {
	Date        time.Time
	Label       string
	NewMembers  int64
	Reactivated int64
}

type TierDistributionSlice struct {
	TierCode string
	TierName string
	Count    int64
	Color    string
	Percent  float64
}

type HeatmapCell struct {
	Day       int
	HourSlot  int
	Intensity int
}

type TopRewardRow struct {
	RewardID   uuid.UUID
	Name       string
	ClaimCount int64
}

type RetentionCohortRow struct {
	MonthOffset  int
	Label        string
	RetentionPct float64
}
