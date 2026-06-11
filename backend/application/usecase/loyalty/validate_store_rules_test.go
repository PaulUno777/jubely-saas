package loyalty

import (
	"context"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/google/uuid"
)

func TestValidateStoreRules_draftMissingName(t *testing.T) {
	uc := &ValidateStoreRules{}
	out, err := uc.Execute(context.Background(), ValidateStoreRulesInput{
		TenantID: uuid.New(),
		DraftRules: []rules.Rule{{
			ID: "r1", Name: "", On: true, Trigger: "transaction",
			SchemaVersion: 2, EditorTier: "advanced",
			Actions:       []rules.AstAction{{Type: "mult", Factor: 2}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if out.Valid {
		t.Fatal("expected invalid draft")
	}
	if len(out.Conflicts) == 0 {
		t.Fatal("expected constraint reports")
	}
}

func TestMergeDraftRules_replacesTenantRuleByID(t *testing.T) {
	tenant := []rules.Rule{
		{ID: "r1", Name: "Old", On: true, Trigger: "transaction", Action: rules.RuleAction{Type: "rate", Per: 100, Pts: 1}},
		{ID: "r2", Name: "Other", On: true, Trigger: "transaction", Action: rules.RuleAction{Type: "rate", Per: 100, Pts: 1}},
	}
	draft := []rules.Rule{
		{ID: "r1", Name: "New draft", On: true, Trigger: "transaction", SchemaVersion: 2, EditorTier: "advanced",
			Actions: []rules.AstAction{{Type: "mult", Factor: 2}}},
	}
	merged := mergeDraftRules(tenant, draft, "")
	if len(merged) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(merged))
	}
	if merged[1].Name != "New draft" {
		t.Fatalf("expected draft to replace tenant rule, got %q", merged[1].Name)
	}
}

func TestMergeDraftRules_detectsMultiplierOverlap(t *testing.T) {
	tenant := []rules.Rule{
		{ID: "base", Name: "Base", On: true, Trigger: "transaction",
			Cond: rules.RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
			Action: rules.RuleAction{Type: "rate", Per: 100, Pts: 1}},
		{ID: "m1", Name: "HH", On: true, Trigger: "transaction",
			Cond:   rules.RuleCondition{Days: []int{0, 1, 2, 3, 4}, Hours: []int{17, 20}, Tier: "all"},
			Action: rules.RuleAction{Type: "mult", Factor: 2}},
	}
	draft := []rules.Rule{
		{ID: "m2", Name: "VIP", On: true, Trigger: "transaction",
			Cond:   rules.RuleCondition{Days: []int{0, 1, 2, 3, 4}, Hours: []int{18, 21}, Tier: "gold"},
			Action: rules.RuleAction{Type: "mult", Factor: 2}},
	}
	merged := mergeDraftRules(tenant, draft, "")
	conflicts := rules.DetectConflicts(merged)
	foundWarn := false
	for _, c := range conflicts {
		if c.Level == rules.ConflictLevelWarn {
			foundWarn = true
		}
	}
	if !foundWarn {
		t.Fatal("expected overlap warning when draft multiplier overlaps tenant multiplier")
	}
}
