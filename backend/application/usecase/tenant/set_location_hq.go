package tenant

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type SetLocationHQ struct {
	Stores ports.StoreRepository
}

type SetLocationHQInput struct {
	TenantID   uuid.UUID
	LocationID uuid.UUID
}

func (uc *SetLocationHQ) Execute(ctx context.Context, in SetLocationHQInput) (*domain.Store, error) {
	return uc.Stores.SetAsHQ(ctx, in.TenantID, in.LocationID)
}
