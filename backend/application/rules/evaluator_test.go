package rules

import "testing"

func TestEvaluateTransactionBaseRate(t *testing.T) {
	rules := []Rule{{
		ID: "r1", Name: "Standard", On: true, Trigger: "transaction",
		Cond:   RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
		Action: RuleAction{Type: "rate", Per: 100, Pts: 1},
	}}
	out := EvaluateTransaction(rules, EvalContext{AmountFcfa: 5000, Day: 1, Hour: 12, Tier: "bronze"})
	if out.Total != 50 {
		t.Fatalf("expected 50 points, got %d", out.Total)
	}
}

func TestHasActiveBaseRule(t *testing.T) {
	rules := DefaultPilotRules()
	if !HasActiveBaseRule(rules, []bool{true}) {
		t.Fatal("expected base rule")
	}
	if HasActiveBaseRule(nil, nil) {
		t.Fatal("expected no base rule")
	}
}

func TestEvaluateAdvancedMultiplier(t *testing.T) {
	rule := Rule{
		ID: "a1", Name: "VIP", On: true, SchemaVersion: 2, EditorTier: "advanced",
		Trigger: "transaction", Logic: "AND",
		Conditions: []AstCondition{{Type: "amount", Op: ">=", Value: 1000}},
		Actions:    []AstAction{{Type: "mult", Factor: 2}},
	}
	base, total, factor := 50, 50, 1.0
	var trace []TraceEntry
	evaluateAdvancedRule(rule, EvalContext{AmountFcfa: 5000, Day: 1, Hour: 12, Tier: "or"}, &base, &total, &factor, &trace)
	if factor != 2 {
		t.Fatalf("expected factor 2, got %v", factor)
	}
}

func TestRecomputeRulePriorities(t *testing.T) {
	rules := []Rule{
		{ID: "m", Action: RuleAction{Type: "mult"}},
		{ID: "r", Action: RuleAction{Type: "rate"}},
		{ID: "f", Action: RuleAction{Type: "flat"}},
	}
	p := RecomputeRulePriorities(rules)
	if p["r"] >= p["f"] || p["f"] >= p["m"] {
		t.Fatalf("unexpected order: %+v", p)
	}
}
