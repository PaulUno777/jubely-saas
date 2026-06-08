package loyalty

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/google/uuid"
)

type ValidateStoreRules struct {
	Rules ports.PointsRuleRepository
	Subs  ports.SubscriptionRepository
	Plans ports.PlanCatalogRepository
}

type ValidateStoreRulesInput struct {
	TenantID uuid.UUID
}

type ValidateStoreRulesOutput struct {
	Conflicts []rules.ConflictReport
}

func (uc *ValidateStoreRules) Execute(ctx context.Context, in ValidateStoreRulesInput) (*ValidateStoreRulesOutput, error) {
	recs, err := uc.Rules.ListByTenant(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	parsed, err := recordsToRules(recs)
	if err != nil {
		return nil, err
	}
	active := make([]rules.Rule, 0, len(parsed))
	for i, rec := range recs {
		if rec.Active && parsed[i].On {
			active = append(active, parsed[i])
		}
	}
	if len(active) == 0 {
		active = rules.DefaultPilotRules()
	}
	if err := requireAdvancedRulesIfNeeded(ctx, uc.Subs, uc.Plans, in.TenantID, active); err != nil {
		return nil, err
	}
	return &ValidateStoreRulesOutput{Conflicts: rules.DetectConflicts(active)}, nil
}

func requireAdvancedRulesIfNeeded(
	ctx context.Context,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	tenantID uuid.UUID,
	active []rules.Rule,
) error {
	for _, r := range active {
		if r.Action.Type == "mult" || (r.Trigger != "transaction" && r.Trigger != "enroll") {
			return billing.RequirePlanFeature(ctx, subs, plans, tenantID, billing.PlanFeatureAdvancedRules)
		}
	}
	return nil
}
