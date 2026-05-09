package domain

import "slices"

// ValidTenantPlans matches Phase 1 planning (Starter / Growth / Business).
var ValidTenantPlans = []string{"starter", "growth", "business"}

func IsValidTenantPlan(plan string) bool {
	return slices.Contains(ValidTenantPlans, plan)
}
