package ports

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PointsRuleRecord struct {
	ID               uuid.UUID
	TenantID         uuid.UUID
	RuleJSON         json.RawMessage
	Active           bool
	Priority         int
	EditorTier       string
	FrozenAt         *time.Time
	FrozenReason     *string
	CurrentVersionID *uuid.UUID
	CreatedAt        time.Time
}

type RuleVersionRecord struct {
	ID            uuid.UUID
	RuleID        uuid.UUID
	TenantID      uuid.UUID
	VersionNumber int
	RuleJSON      json.RawMessage
	EditorTier    string
	CreatedBy     *uuid.UUID
	CreatedAt     time.Time
	ChangeSummary *string
}

type PointsRuleRepository interface {
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]PointsRuleRecord, error)
	FindByID(ctx context.Context, tenantID, ruleID uuid.UUID) (*PointsRuleRecord, error)
	Create(ctx context.Context, rec *PointsRuleRecord) error
	Update(ctx context.Context, rec *PointsRuleRecord) error
	Delete(ctx context.Context, tenantID, ruleID uuid.UUID) error
	FreezeAdvancedByTenant(ctx context.Context, tenantID uuid.UUID, reason string) error
	RecomputePriorities(ctx context.Context, tenantID uuid.UUID, priorities map[uuid.UUID]int) error
}

type RuleVersionRepository interface {
	Create(ctx context.Context, rec *RuleVersionRecord) error
	ListByRule(ctx context.Context, tenantID, ruleID uuid.UUID, limit int) ([]RuleVersionRecord, error)
	FindByID(ctx context.Context, tenantID, versionID uuid.UUID) (*RuleVersionRecord, error)
	NextVersionNumber(ctx context.Context, ruleID uuid.UUID) (int, error)
}

type PurchaseIngestionRepository interface {
	FindByKey(ctx context.Context, tenantID uuid.UUID, key string) (json.RawMessage, int, error)
	Insert(ctx context.Context, tenantID uuid.UUID, key string, enrollmentID *uuid.UUID, amountFcfa int64, points int, payload json.RawMessage) error
}
