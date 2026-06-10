package rules

import (
	"fmt"
	"strings"
)

const maxConditions = 32
const maxActions = 16

func validateAdvancedRule(r Rule) error {
	if !r.IsAdvanced() {
		return nil
	}
	if len(r.Conditions) > maxConditions {
		return fmt.Errorf("too many conditions")
	}
	if len(r.Actions) == 0 || len(r.Actions) > maxActions {
		return fmt.Errorf("invalid actions count")
	}
	if r.Logic != "" && r.Logic != "AND" && r.Logic != "OR" {
		return fmt.Errorf("invalid logic")
	}
	return nil
}

func advancedConditionsMatch(r Rule, ctx EvalContext) bool {
	if len(r.Conditions) == 0 {
		return true
	}
	logic := r.Logic
	if logic == "" {
		logic = "AND"
	}
	if logic == "OR" {
		for _, c := range r.Conditions {
			if evalAstCondition(c, ctx) {
				return true
			}
		}
		return false
	}
	for _, c := range r.Conditions {
		if !evalAstCondition(c, ctx) {
			return false
		}
	}
	return true
}

func evalAstCondition(c AstCondition, ctx EvalContext) bool {
	switch c.Type {
	case "amount":
		v := int64(c.Value)
		switch strings.TrimSpace(c.Op) {
		case "≤", "<=":
			return ctx.AmountFcfa <= v
		case "=", "==":
			return ctx.AmountFcfa == v
		default:
			return ctx.AmountFcfa >= v
		}
	case "weekday":
		for _, d := range c.Days {
			if d == ctx.Day {
				return true
			}
		}
		return false
	case "hours":
		if c.From == 0 && c.To == 0 {
			return true
		}
		return ctx.Hour >= c.From && ctx.Hour < c.To
	case "tier":
		if len(c.Tiers) == 0 {
			return true
		}
		for _, t := range c.Tiers {
			if t == ctx.Tier {
				return true
			}
		}
		return false
	default:
		return true
	}
}

func applyAdvancedActions(r Rule, base, total *int, factor *float64, trace *[]TraceEntry) {
	for _, act := range r.Actions {
		entry := TraceEntry{RuleID: r.ID, RuleName: r.Name}
		switch act.Type {
		case "mult":
			if act.Factor <= 0 {
				entry.Applied = false
				entry.Reason = "Multiplicateur invalide"
			} else {
				*factor *= act.Factor
				entry.Applied = true
				entry.Pts = "×" + formatFloat(act.Factor)
				entry.Detail = "Multiplicateur (avancé)"
			}
		case "flat":
			*total += act.Pts
			entry.Applied = true
			entry.Pts = "+" + itoa(act.Pts)
			entry.Detail = "Bonus fixe (avancé)"
		default:
			entry.Applied = true
			entry.Detail = act.Type + " (effet async)"
		}
		*trace = append(*trace, entry)
	}
}

func evaluateAdvancedRule(r Rule, ctx EvalContext, base, total *int, factor *float64, trace *[]TraceEntry) {
	if r.Frozen {
		*trace = append(*trace, TraceEntry{
			RuleID: r.ID, RuleName: r.Name, Applied: false,
			Reason: "Règle gelée (plan Standard)",
		})
		return
	}
	trigOk := r.Trigger == "transaction" ||
		(r.Trigger == "enroll" && ctx.IsNew) ||
		r.Trigger == "birthday"
	if !trigOk {
		*trace = append(*trace, TraceEntry{
			RuleID: r.ID, RuleName: r.Name, Applied: false, Reason: "Déclencheur non éligible",
		})
		return
	}
	if !advancedConditionsMatch(r, ctx) {
		*trace = append(*trace, TraceEntry{
			RuleID: r.ID, RuleName: r.Name, Applied: false, Reason: "Hors conditions",
		})
		return
	}
	applyAdvancedActions(r, base, total, factor, trace)
}
