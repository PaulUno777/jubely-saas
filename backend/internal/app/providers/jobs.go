package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/internal/jobs"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ProvideJobRunner(
	pool *pgxpool.Pool,
	campaigns *postgres.CampaignRepository,
	analytics *postgres.AnalyticsRepository,
	clock ports.Clock,
) *jobs.Runner {
	return &jobs.Runner{
		Pool:      pool,
		Campaigns: campaigns,
		Analytics: analytics,
		Clock:     clock,
	}
}
