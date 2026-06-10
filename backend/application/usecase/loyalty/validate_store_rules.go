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
	TenantID   uuid.UUID
	DraftRules []rules.Rule
}

type ValidateStoreRulesOutput struct {
	Conflicts []rules.ConflictReport
}

func (uc *ValidateStoreRules) Execute(ctx context.Context, in ValidateStoreRulesInput) (*ValidateStoreRulesOutput, error) {
	var active []rules.Rule
	if len(in.DraftRules) > 0 {
		active = in.DraftRules
	} else {
		recs, err := uc.Rules.ListByTenant(ctx, in.TenantID)
		if err != nil {
			return nil, err
		}
		parsed, err := recordsToRules(recs)
		if err != nil {
			return nil, err
		}
		active = activeRules(recs, parsed)
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
		if r.IsAdvanced() || r.EditorTier == "advanced" {
			return billing.RequirePlanFeature(ctx, subs, plans, tenantID, billing.PlanFeatureAdvancedRules)
		}
		if r.Action.Type == "mult" || (r.Trigger != "transaction" && r.Trigger != "enroll") {
			return billing.RequirePlanFeature(ctx, subs, plans, tenantID, billing.PlanFeatureAdvancedRules)
		}
	}
	return nil
}
