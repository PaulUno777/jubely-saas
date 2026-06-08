package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// TenantDashboardMetrics aggregates loyalty KPIs for merchant admin dashboards (legacy flat summary).
type TenantDashboardMetrics struct {
	PointsDistributed    int64
	PointEventsThisMonth int64
	ClientsServedToday   int64
	PointsIssuedToday    int64
	RedemptionsToday     int64
	NewEnrollmentsToday  int64
}

// TenantMetricsInput scopes dashboard aggregates by tenant, period, and optional location.
type TenantMetricsInput struct {
	TenantID   uuid.UUID
	From       time.Time
	To         time.Time
	LocationID *uuid.UUID
}

// TenantMetricsPeriod describes the resolved query window.
type TenantMetricsPeriod struct {
	From  time.Time
	To    time.Time
	Label string
}

// TenantMetricKPI is one KPI card with trend data.
type TenantMetricKPI struct {
	Key       string
	Value     float64
	Unit      string
	DeltaPct  float64
	TrendUp   bool
	Sparkline []int64
}

// TenantMetricsResult is the GET /tenants/:id/metrics payload core.
type TenantMetricsResult struct {
	Period         TenantMetricsPeriod
	LocationScope  string
	KPIs           []TenantMetricKPI
}

// TenantLoyaltyActivityPoint is one day in the loyalty activity chart.
type TenantLoyaltyActivityPoint struct {
	Date              time.Time
	Label             string
	PointsDistributed int64
	PointsRewarded    int64
}

// TenantLoyaltyActivityResult is the GET /tenants/:id/metrics/loyalty-activity payload core.
type TenantLoyaltyActivityResult struct {
	Period TenantMetricsPeriod
	Series []TenantLoyaltyActivityPoint
}

// TenantNavStats holds resource counts for merchant navigation badges.
type TenantNavStats struct {
	Customers    int64
	Locations    int64
	TeamMembers  int64
	RulesActive  int64
	RewardsActive int64
	Campaigns    int64
}

// TenantLoyaltyMetrics reads tenant-level loyalty aggregates for dashboards.
type TenantLoyaltyMetrics interface {
	TenantSummary(ctx context.Context, tenantID uuid.UUID) (TenantDashboardMetrics, error)
	TenantMetrics(ctx context.Context, in TenantMetricsInput) (TenantMetricsResult, error)
	TenantLoyaltyActivity(ctx context.Context, in TenantMetricsInput) (TenantLoyaltyActivityResult, error)
	TenantNavStats(ctx context.Context, tenantID uuid.UUID) (TenantNavStats, error)
}

// NearbyLocationsQuery filters public location discovery.
type NearbyLocationsQuery struct {
	Lat         *float64
	Lng         *float64
	CountryCode string
	City        string
	RadiusKm    float64
	Limit       int
}

// NearbyLocationRow is one discoverable physical location with tenant branding.
type NearbyLocationRow struct {
	ID           uuid.UUID
	TenantID     uuid.UUID
	TenantName   string
	TenantSlug   string
	Name         string
	Slug         string
	City         string
	CountryCode  string
	StateCode    string
	AddressLine  string
	Lat          *float64
	Lng          *float64
	DistanceKm   *float64
	Status       string
}

// LocationDiscoveryRepository lists open locations for customer nearby discovery.
type LocationDiscoveryRepository interface {
	ListNearby(ctx context.Context, q NearbyLocationsQuery) ([]NearbyLocationRow, string, error)
}
