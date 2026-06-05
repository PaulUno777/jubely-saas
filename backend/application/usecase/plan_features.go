package usecase

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

const (
	PlanFeatureAdvancedRules = "advanced_rules"
	PlanFeatureCampaigns     = "campaigns"
)

// PlanHasFeature reads a boolean flag from plan_catalog.features JSON.
func PlanHasFeature(plan *domain.PlanCatalog, feature string) bool {
	if plan == nil || len(plan.Features) == 0 {
		return false
	}
	var feats map[string]any
	if err := json.Unmarshal(plan.Features, &feats); err != nil {
		return false
	}
	v, ok := feats[feature]
	if !ok {
		return false
	}
	b, ok := v.(bool)
	return ok && b
}

// RequirePlanFeature returns domain.ErrForbidden when the tenant subscription plan lacks feature.
func RequirePlanFeature(
	ctx context.Context,
	subs ports.SubscriptionRepository,
	plans ports.PlanCatalogRepository,
	tenantID uuid.UUID,
	feature string,
) error {
	sub, err := subs.FindByOrganization(ctx, tenantID)
	if err != nil {
		return err
	}
	plan, err := plans.FindByCode(ctx, sub.PlanCode)
	if err != nil {
		return err
	}
	if !PlanHasFeature(plan, feature) {
		return fmt.Errorf("%w", domain.ErrForbidden)
	}
	return nil
}
