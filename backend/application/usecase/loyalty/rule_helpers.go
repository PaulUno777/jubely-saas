package loyalty

import (
	"context"
	"encoding/json"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/google/uuid"
)

func recordsToRules(recs []ports.PointsRuleRecord) ([]rules.Rule, error) {
	raw := make([]json.RawMessage, 0, len(recs))
	for _, rec := range recs {
		raw = append(raw, rec.RuleJSON)
	}
	parsed, err := rules.ParseRules(raw)
	if err != nil {
		return nil, err
	}
	for i := range parsed {
		if recs[i].FrozenAt != nil {
			parsed[i].Frozen = true
		}
		if recs[i].FrozenReason != nil {
			parsed[i].FrozenReason = *recs[i].FrozenReason
		}
		if recs[i].EditorTier == "advanced" {
			parsed[i].EditorTier = "advanced"
			if parsed[i].SchemaVersion == 0 {
				parsed[i].SchemaVersion = 2
			}
		}
	}
	return parsed, nil
}

func activeRules(recs []ports.PointsRuleRecord, parsed []rules.Rule) []rules.Rule {
	active := make([]rules.Rule, 0, len(parsed))
	for i, rec := range recs {
		if rec.Active && parsed[i].On && !parsed[i].Frozen && rec.FrozenAt == nil {
			active = append(active, parsed[i])
		}
	}
	return active
}

func recomputeAndPersist(ctx context.Context, repo ports.PointsRuleRepository, tenantID uuid.UUID) error {
	recs, err := repo.ListByTenant(ctx, tenantID)
	if err != nil {
		return err
	}
	parsed, err := recordsToRules(recs)
	if err != nil {
		return err
	}
	priorities := rules.RecomputeRulePriorities(parsed)
	byID := make(map[uuid.UUID]int, len(priorities))
	for _, rec := range recs {
		var r rules.Rule
		_ = json.Unmarshal(rec.RuleJSON, &r)
		if p, ok := priorities[r.ID]; ok {
			byID[rec.ID] = p
		}
	}
	if err := repo.RecomputePriorities(ctx, tenantID, byID); err != nil {
		return err
	}
	rules.InvalidateTenantRulesCache(tenantID.String())
	return nil
}

func editorTierForRule(r rules.Rule) string {
	if r.IsAdvanced() || r.EditorTier == "advanced" {
		return "advanced"
	}
	return "basic"
}

// normalizeRuleForStorage ensures advanced rules carry valid basic cond/action stubs for JSON round-trips.
func normalizeRuleForStorage(r *rules.Rule) {
	if r == nil || !r.IsAdvanced() {
		return
	}
	if len(r.Cond.Days) == 0 {
		r.Cond = rules.RuleCondition{
			Days:      []int{0, 1, 2, 3, 4, 5, 6},
			Tier:      "all",
			MinAmount: 0,
		}
	}
	if r.Action.Type == "" {
		r.Action = rules.RuleAction{Type: "rate", Per: 100, Pts: 0}
	}
}
