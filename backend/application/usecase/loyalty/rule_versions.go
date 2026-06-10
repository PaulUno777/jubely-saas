package loyalty

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListRuleVersions struct {
	Versions ports.RuleVersionRepository
}

func (uc *ListRuleVersions) Execute(ctx context.Context, tenantID, ruleID uuid.UUID) ([]ports.RuleVersionRecord, error) {
	return uc.Versions.ListByRule(ctx, tenantID, ruleID, 50)
}

type RestoreRuleVersion struct {
	Rules    ports.PointsRuleRepository
	Versions ports.RuleVersionRepository
}

type RestoreRuleVersionInput struct {
	TenantID  uuid.UUID
	RuleID    uuid.UUID
	VersionID uuid.UUID
	ActorID   *uuid.UUID
}

func (uc *RestoreRuleVersion) Execute(ctx context.Context, in RestoreRuleVersionInput) (*ports.PointsRuleRecord, error) {
	ver, err := uc.Versions.FindByID(ctx, in.TenantID, in.VersionID)
	if err != nil {
		return nil, err
	}
	if ver.RuleID != in.RuleID {
		return nil, domain.ErrNotFound
	}
	rec, err := uc.Rules.FindByID(ctx, in.TenantID, in.RuleID)
	if err != nil {
		return nil, err
	}
	if rec.FrozenAt != nil {
		return nil, fmt.Errorf("%w", domain.ErrForbidden)
	}
	summary := fmt.Sprintf("Restauré depuis v%d", ver.VersionNumber)
	patch := &PatchStoreRule{
		Rules: uc.Rules, Versions: uc.Versions,
	}
	var rule rules.Rule
	if err := json.Unmarshal(ver.RuleJSON, &rule); err != nil {
		return nil, err
	}
	return patch.Execute(ctx, PatchStoreRuleInput{
		TenantID: in.TenantID,
		RuleID:   in.RuleID,
		Rule:     &rule,
		ActorID:  in.ActorID,
		Summary:  summary,
	})
}
