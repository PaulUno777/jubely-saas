package loyalty

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListStoreRules struct {
	Rules ports.PointsRuleRepository
}

func (uc *ListStoreRules) Execute(ctx context.Context, tenantID uuid.UUID) ([]ports.PointsRuleRecord, error) {
	return uc.Rules.ListByTenant(ctx, tenantID)
}

type CreateStoreRule struct {
	Rules ports.PointsRuleRepository
}

type CreateStoreRuleInput struct {
	TenantID uuid.UUID
	Rule     rules.Rule
	Priority int
	Active   bool
}

func (uc *CreateStoreRule) Execute(ctx context.Context, in CreateStoreRuleInput) (*ports.PointsRuleRecord, error) {
	if in.Rule.Name == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if in.Rule.ID == "" {
		in.Rule.ID = uuid.New().String()
	}
	raw, err := json.Marshal(in.Rule)
	if err != nil {
		return nil, err
	}
	rec := &ports.PointsRuleRecord{
		ID:       uuid.New(),
		TenantID: in.TenantID,
		RuleJSON: raw,
		Active:   in.Active,
		Priority: in.Priority,
	}
	if err := uc.Rules.Create(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

type PatchStoreRule struct {
	Rules ports.PointsRuleRepository
}

type PatchStoreRuleInput struct {
	TenantID uuid.UUID
	RuleID   uuid.UUID
	Rule     *rules.Rule
	Active   *bool
	Priority *int
}

func (uc *PatchStoreRule) Execute(ctx context.Context, in PatchStoreRuleInput) (*ports.PointsRuleRecord, error) {
	rec, err := uc.Rules.FindByID(ctx, in.TenantID, in.RuleID)
	if err != nil {
		return nil, err
	}
	var rule rules.Rule
	if err := json.Unmarshal(rec.RuleJSON, &rule); err != nil {
		return nil, err
	}
	if in.Rule != nil {
		rule = *in.Rule
		if rule.ID == "" {
			rule.ID = rec.ID.String()
		}
		raw, err := json.Marshal(rule)
		if err != nil {
			return nil, err
		}
		rec.RuleJSON = raw
	}
	if in.Active != nil {
		rec.Active = *in.Active
	}
	if in.Priority != nil {
		rec.Priority = *in.Priority
	}
	if err := uc.Rules.Update(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

type SimulateStoreRules struct {
	Rules ports.PointsRuleRepository
}

type SimulateStoreRulesInput struct {
	TenantID   uuid.UUID
	AmountFcfa int64
	OccurredAt time.Time
	Tier       string
	IsNew      bool
}

func (uc *SimulateStoreRules) Execute(ctx context.Context, in SimulateStoreRulesInput) (rules.EvalResult, error) {
	parsed, err := uc.loadActiveRules(ctx, in.TenantID)
	if err != nil {
		return rules.EvalResult{}, err
	}
	return rules.EvaluateTransaction(parsed, evalContextFromInput(in)), nil
}

func (uc *SimulateStoreRules) loadActiveRules(ctx context.Context, tenantID uuid.UUID) ([]rules.Rule, error) {
	recs, err := uc.Rules.ListByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	parsed, err := recordsToRules(recs)
	if err != nil {
		return nil, err
	}
	var active []rules.Rule
	for i, rec := range recs {
		if rec.Active && parsed[i].On {
			active = append(active, parsed[i])
		}
	}
	if len(active) == 0 {
		return rules.DefaultPilotRules(), nil
	}
	return active, nil
}

func recordsToRules(recs []ports.PointsRuleRecord) ([]rules.Rule, error) {
	raw := make([]json.RawMessage, 0, len(recs))
	for _, rec := range recs {
		raw = append(raw, rec.RuleJSON)
	}
	return rules.ParseRules(raw)
}

func evalContextFromInput(in SimulateStoreRulesInput) rules.EvalContext {
	t := in.OccurredAt
	if t.IsZero() {
		t = time.Now().UTC()
	}
	return rules.EvalContext{
		AmountFcfa: in.AmountFcfa,
		Day:        rules.WeekdayToSimDay(t),
		Hour:       t.Hour(),
		Tier:       in.Tier,
		IsNew:      in.IsNew,
	}
}

// EvaluatePurchasePoints loads tenant rules and returns points for a purchase.
func EvaluatePurchasePoints(ctx context.Context, repo ports.PointsRuleRepository, tenantID uuid.UUID, amountFcfa int64, tier string, occurredAt time.Time) (rules.EvalResult, error) {
	sim := &SimulateStoreRules{Rules: repo}
	return sim.Execute(ctx, SimulateStoreRulesInput{
		TenantID:   tenantID,
		AmountFcfa: amountFcfa,
		OccurredAt: occurredAt,
		Tier:       tier,
	})
}
