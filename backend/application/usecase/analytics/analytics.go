package analytics

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
)

type TenantAnalyticsOverview struct {
	Analytics ports.TenantAnalyticsRepository
}

type TenantAnalyticsOverviewInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

func (uc *TenantAnalyticsOverview) Execute(ctx context.Context, in TenantAnalyticsOverviewInput) (ports.AnalyticsOverview, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return ports.AnalyticsOverview{}, err
	}
	return uc.Analytics.Overview(ctx, rng)
}

type MemberGrowth struct {
	Analytics ports.TenantAnalyticsRepository
}

type MemberGrowthInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

func (uc *MemberGrowth) Execute(ctx context.Context, in MemberGrowthInput) ([]ports.MemberGrowthPoint, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return nil, err
	}
	return uc.Analytics.MemberGrowth(ctx, rng)
}

type TierDistribution struct {
	Analytics ports.TenantAnalyticsRepository
}

type TierDistributionInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

func (uc *TierDistribution) Execute(ctx context.Context, in TierDistributionInput) ([]ports.TierDistributionSlice, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return nil, err
	}
	return uc.Analytics.TierDistribution(ctx, rng)
}

type HourlyHeatmap struct {
	Analytics ports.TenantAnalyticsRepository
}

type HourlyHeatmapInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

func (uc *HourlyHeatmap) Execute(ctx context.Context, in HourlyHeatmapInput) ([]ports.HeatmapCell, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return nil, err
	}
	return uc.Analytics.HourlyHeatmap(ctx, rng)
}

type TopRewards struct {
	Analytics ports.TenantAnalyticsRepository
}

type TopRewardsInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
	Limit      int
}

func (uc *TopRewards) Execute(ctx context.Context, in TopRewardsInput) ([]ports.TopRewardRow, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return nil, err
	}
	limit := in.Limit
	if limit <= 0 {
		limit = 10
	}
	return uc.Analytics.TopRewards(ctx, rng, limit)
}

type RetentionCohorts struct {
	Analytics ports.TenantAnalyticsRepository
}

type RetentionCohortsInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

func (uc *RetentionCohorts) Execute(ctx context.Context, in RetentionCohortsInput) ([]ports.RetentionCohortRow, error) {
	rng, err := resolveAnalyticsRange(in.TenantID, in.From, in.To, in.LocationID)
	if err != nil {
		return nil, err
	}
	return uc.Analytics.RetentionCohorts(ctx, rng)
}
