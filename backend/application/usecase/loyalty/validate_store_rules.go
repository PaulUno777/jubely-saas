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
	TenantID      uuid.UUID
	DraftRules    []rules.Rule
	ExcludeRuleID string
}

type ValidateStoreRulesOutput struct {
	Valid     bool
	Conflicts []rules.ConflictReport
}

func (uc *ValidateStoreRules) Execute(ctx context.Context, in ValidateStoreRulesInput) (*ValidateStoreRulesOutput, error) {
	conflicts := make([]rules.ConflictReport, 0)

	for _, d := range in.DraftRules {
		conflicts = append(conflicts, rules.ValidateRuleConstraints(d)...)
	}

	var forConflicts []rules.Rule
	if len(in.DraftRules) > 0 {
		if uc.Rules != nil {
			recs, err := uc.Rules.ListByTenant(ctx, in.TenantID)
			if err != nil {
				return nil, err
			}
			parsed, err := recordsToRules(recs)
			if err != nil {
				return nil, err
			}
			tenantActive := activeRules(recs, parsed)
			forConflicts = mergeDraftRules(tenantActive, in.DraftRules, in.ExcludeRuleID)
		} else {
			forConflicts = in.DraftRules
		}
	} else {
		recs, err := uc.Rules.ListByTenant(ctx, in.TenantID)
		if err != nil {
			return nil, err
		}
		parsed, err := recordsToRules(recs)
		if err != nil {
			return nil, err
		}
		forConflicts = activeRules(recs, parsed)
	}

	if uc.Subs != nil && uc.Plans != nil {
		if err := requireAdvancedRulesIfNeeded(ctx, uc.Subs, uc.Plans, in.TenantID, forConflicts); err != nil {
			return nil, err
		}
	}

	conflicts = append(conflicts, rules.DetectConflicts(forConflicts)...)
	return &ValidateStoreRulesOutput{
		Valid:     !rules.HasBlockingConflicts(conflicts),
		Conflicts: conflicts,
	}, nil
}

func mergeDraftRules(tenantActive []rules.Rule, drafts []rules.Rule, excludeRuleID string) []rules.Rule {
	skipIDs := make(map[string]struct{}, len(drafts)+1)
	for _, d := range drafts {
		skipIDs[d.ID] = struct{}{}
	}
	if excludeRuleID != "" {
		skipIDs[excludeRuleID] = struct{}{}
	}

	merged := make([]rules.Rule, 0, len(tenantActive)+len(drafts))
	for _, r := range tenantActive {
		if _, skip := skipIDs[r.ID]; skip {
			continue
		}
		merged = append(merged, r)
	}
	merged = append(merged, drafts...)
	return merged
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
