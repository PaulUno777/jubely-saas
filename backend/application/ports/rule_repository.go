package ports

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
)

type PointsRuleRecord struct {
	ID       uuid.UUID
	TenantID uuid.UUID
	RuleJSON json.RawMessage
	Active   bool
	Priority int
}

type PointsRuleRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]PointsRuleRecord, error)
	FindByID(ctx context.Context, tenantID, ruleID uuid.UUID) (*PointsRuleRecord, error)
	Create(ctx context.Context, rec *PointsRuleRecord) error
	Update(ctx context.Context, rec *PointsRuleRecord) error
}
