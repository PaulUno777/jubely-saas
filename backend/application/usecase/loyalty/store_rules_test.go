package loyalty

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type stubRulesRepo struct {
	recs []ports.PointsRuleRecord
}

func (s *stubRulesRepo) ListByTenant(_ context.Context, _ uuid.UUID) ([]ports.PointsRuleRecord, error) {
	return s.recs, nil
}

func (s *stubRulesRepo) FindByID(context.Context, uuid.UUID, uuid.UUID) (*ports.PointsRuleRecord, error) {
	return nil, domain.ErrNotFound
}

func (s *stubRulesRepo) Create(context.Context, *ports.PointsRuleRecord) error { return nil }

func (s *stubRulesRepo) Update(context.Context, *ports.PointsRuleRecord) error { return nil }

func (s *stubRulesRepo) Delete(context.Context, uuid.UUID, uuid.UUID) error { return nil }

func (s *stubRulesRepo) FreezeAdvancedByTenant(context.Context, uuid.UUID, string) error { return nil }

func (s *stubRulesRepo) RecomputePriorities(context.Context, uuid.UUID, map[uuid.UUID]int) error {
	return nil
}

func ruleJSON(r rules.Rule) json.RawMessage {
	b, _ := json.Marshal(r)
	return b
}

func TestEvaluatePurchasePoints_inactiveWithoutBaseRule(t *testing.T) {
	repo := &stubRulesRepo{recs: []ports.PointsRuleRecord{{
		ID: uuid.New(), Active: true,
		RuleJSON: ruleJSON(rules.Rule{
			ID: "b1", Name: "Bonus", On: true, Trigger: "enroll",
			Cond: rules.RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "new"},
			Action: rules.RuleAction{Type: "flat", Pts: 50},
		}),
	}}}
	_, err := EvaluatePurchasePoints(context.Background(), repo, uuid.New(), 5000, "bronze", time.Now().UTC())
	if !errors.Is(err, domain.ErrLoyaltyInactive) {
		t.Fatalf("expected ErrLoyaltyInactive, got %v", err)
	}
}

func TestEvaluatePurchasePoints_activeWithBaseRule(t *testing.T) {
	repo := &stubRulesRepo{recs: []ports.PointsRuleRecord{{
		ID: uuid.New(), Active: true,
		RuleJSON: ruleJSON(rules.Rule{
			ID: "r1", Name: "Standard", On: true, Trigger: "transaction",
			Cond: rules.RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
			Action: rules.RuleAction{Type: "rate", Per: 100, Pts: 1},
		}),
	}}}
	out, err := EvaluatePurchasePoints(context.Background(), repo, uuid.New(), 5000, "bronze", time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	if out.Total != 50 {
		t.Fatalf("expected 50 points, got %d", out.Total)
	}
}

func TestEvaluateEnrollmentPoints_enrollBonus(t *testing.T) {
	repo := &stubRulesRepo{recs: []ports.PointsRuleRecord{
		{
			ID: uuid.New(), Active: true,
			RuleJSON: ruleJSON(rules.Rule{
				ID: "r1", Name: "Standard", On: true, Trigger: "transaction",
				Cond: rules.RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
				Action: rules.RuleAction{Type: "rate", Per: 100, Pts: 1},
			}),
		},
		{
			ID: uuid.New(), Active: true,
			RuleJSON: ruleJSON(rules.Rule{
				ID: "e1", Name: "Welcome", On: true, Trigger: "enroll",
				Cond: rules.RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "new"},
				Action: rules.RuleAction{Type: "flat", Pts: 50},
			}),
		},
	}}
	out, err := EvaluateEnrollmentPoints(context.Background(), repo, uuid.New(), "bronze", time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	if out.Total != 50 {
		t.Fatalf("expected 50 enroll bonus, got %d", out.Total)
	}
}
