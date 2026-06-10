package rules

import "testing"

func TestValidateRuleConstraints_requiresName(t *testing.T) {
	reports := ValidateRuleConstraints(Rule{
		ID: "r1", Name: "  ", On: true, Trigger: "transaction",
		SchemaVersion: 2, EditorTier: "advanced",
		Actions: []AstAction{{Type: "mult", Factor: 2}},
	})
	if len(reports) == 0 {
		t.Fatal("expected name constraint violation")
	}
	if reports[0].Level != ConflictLevelError {
		t.Fatalf("expected error level, got %s", reports[0].Level)
	}
}

func TestValidateRuleConstraints_advancedRequiresActions(t *testing.T) {
	reports := ValidateRuleConstraints(Rule{
		ID: "r1", Name: "Test", On: true, Trigger: "transaction",
		SchemaVersion: 2, EditorTier: "advanced",
		Actions:         nil,
	})
	if len(reports) == 0 {
		t.Fatal("expected actions constraint violation")
	}
}

func TestValidateRuleConstraints_validAdvanced(t *testing.T) {
	reports := ValidateRuleConstraints(Rule{
		ID: "r1", Name: "Weekend boost", On: true, Trigger: "transaction",
		SchemaVersion: 2, EditorTier: "advanced",
		Actions:       []AstAction{{Type: "mult", Factor: 2}},
	})
	if len(reports) > 0 {
		t.Fatalf("unexpected violations: %+v", reports)
	}
}

func TestHasBlockingConflicts(t *testing.T) {
	if !HasBlockingConflicts([]ConflictReport{{Level: ConflictLevelError}}) {
		t.Fatal("expected blocking")
	}
	if HasBlockingConflicts([]ConflictReport{{Level: ConflictLevelWarn}}) {
		t.Fatal("warn should not block")
	}
}
