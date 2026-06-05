package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CampaignRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID, status *string) ([]domain.Campaign, error)
	FindByID(ctx context.Context, tenantID, campaignID uuid.UUID) (*domain.Campaign, error)
	Create(ctx context.Context, campaign *domain.Campaign) error
	Update(ctx context.Context, campaign *domain.Campaign) error
	CountByTenant(ctx context.Context, tenantID uuid.UUID, status *string) (int64, error)
}
