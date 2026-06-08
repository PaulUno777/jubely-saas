package ports

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type AuditRepository interface {
	Append(ctx context.Context, event *domain.AuditEvent) error
	ListByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.AuditEvent, error)
}
