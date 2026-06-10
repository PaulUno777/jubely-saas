package rules

import "testing"

func TestDetectConflicts_missingBaseRate(t *testing.T) {
	conflicts := DetectConflicts([]Rule{{
		ID: "b1", Name: "Bonus", On: true, Tag: "Bonus", Trigger: "enroll",
		Cond: RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "new"},
		Action: RuleAction{Type: "flat", Pts: 50},
	}})
	found := false
	for _, c := range conflicts {
		if c.Level == ConflictLevelError {
			found = true
		}
	}
	if !found {
		t.Fatal("expected error conflict for missing base rate")
	}
}

func TestDetectConflicts_overlappingMultipliers(t *testing.T) {
	rules := []Rule{
		{
			ID: "r", Name: "Base", On: true, Trigger: "transaction",
			Cond: RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
			Action: RuleAction{Type: "rate", Per: 100, Pts: 1},
		},
		{
			ID: "m1", Name: "HH", On: true, Trigger: "transaction",
			Cond:   RuleCondition{Days: []int{0, 1, 2, 3, 4}, Hours: []int{17, 20}, Tier: "all"},
			Action: RuleAction{Type: "mult", Factor: 2},
		},
		{
			ID: "m2", Name: "VIP", On: true, Trigger: "transaction",
			Cond:   RuleCondition{Days: []int{0, 1, 2, 3, 4}, Hours: []int{18, 21}, Tier: "or"},
			Action: RuleAction{Type: "mult", Factor: 2},
		},
	}
	conflicts := DetectConflicts(rules)
	if len(conflicts) == 0 {
		t.Fatal("expected overlap warning")
	}
}
