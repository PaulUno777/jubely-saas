package presenter

import (
	"encoding/json"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/gin-gonic/gin"
)

func Subscription(sub *domain.Subscription, plan *domain.PlanCatalog) gin.H {
	h := gin.H{
		"plan_code":                 sub.PlanCode,
		"status":                    string(sub.Status),
		"billing_period":            sub.BillingPeriod,
		"cancel_at_period_end":      sub.CancelAtPeriodEnd,
		"payment_method_preference": sub.PaymentMethodPref,
	}
	if sub.TrialEndsAt != nil {
		h["trial_ends_at"] = sub.TrialEndsAt
	}
	if sub.CurrentPeriodEnd != nil {
		h["current_period_end"] = sub.CurrentPeriodEnd
	}
	if plan != nil {
		ph := gin.H{
			"code":                 plan.Code,
			"name":                 plan.Name,
			"max_stores":           plan.MaxStores,
			"max_agents":           plan.MaxAgents,
			"max_active_customers": plan.MaxActiveCustomers,
			"price_monthly_fcfa":   plan.PriceMonthlyFCFA,
			"price_yearly_fcfa":    plan.PriceYearlyFCFA,
		}
		if len(plan.Features) > 0 {
			var feats map[string]any
			if err := json.Unmarshal(plan.Features, &feats); err == nil {
				ph["features"] = feats
			}
		}
		h["plan"] = ph
	}
	return h
}

func PlanCatalog(p domain.PlanCatalog) gin.H {
	return gin.H{
		"code":                 p.Code,
		"name":                 p.Name,
		"max_stores":           p.MaxStores,
		"max_agents":           p.MaxAgents,
		"max_active_customers": p.MaxActiveCustomers,
		"price_monthly_fcfa":   p.PriceMonthlyFCFA,
		"price_yearly_fcfa":    p.PriceYearlyFCFA,
	}
}
