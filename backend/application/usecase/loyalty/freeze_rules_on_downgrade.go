package loyalty

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/google/uuid"
)

const freezeReasonPlanDowngrade = "plan_downgrade"

// FreezeAdvancedRulesOnDowngrade deactivates advanced rules when plan loses advanced_rules feature.
type FreezeAdvancedRulesOnDowngrade struct {
	Rules ports.PointsRuleRepository
	Subs  ports.SubscriptionRepository
	Plans ports.PlanCatalogRepository
}

func (uc *FreezeAdvancedRulesOnDowngrade) Execute(ctx context.Context, tenantID uuid.UUID, newPlanCode string) error {
	plan, err := uc.Plans.FindByCode(ctx, newPlanCode)
	if err != nil {
		return err
	}
	if billing.PlanHasFeature(plan, billing.PlanFeatureAdvancedRules) {
		return nil
	}
	if err := uc.Rules.FreezeAdvancedByTenant(ctx, tenantID, freezeReasonPlanDowngrade); err != nil {
		return err
	}
	rules.InvalidateTenantRulesCache(tenantID.String())
	return recomputeAndPersist(ctx, uc.Rules, tenantID)
}
