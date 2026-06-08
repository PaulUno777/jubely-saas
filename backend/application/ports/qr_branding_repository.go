package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type QRBrandingRepository interface {
	FindByTenant(ctx context.Context, tenantID uuid.UUID) (*domain.TenantQRBranding, error)
	Upsert(ctx context.Context, branding *domain.TenantQRBranding) error
}
