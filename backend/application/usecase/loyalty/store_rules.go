package loyalty

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
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
	Rules    ports.PointsRuleRepository
	Versions ports.RuleVersionRepository
	Subs     ports.SubscriptionRepository
	Plans    ports.PlanCatalogRepository
}

type CreateStoreRuleInput struct {
	TenantID uuid.UUID
	Rule     rules.Rule
	Priority int
	Active   bool
	ActorID  *uuid.UUID
	Summary  string
}

func (uc *CreateStoreRule) Execute(ctx context.Context, in CreateStoreRuleInput) (*ports.PointsRuleRecord, error) {
	if in.Rule.Name == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if in.Rule.ID == "" {
		in.Rule.ID = uuid.New().String()
	}
	tier := editorTierForRule(in.Rule)
	if tier == "advanced" {
		in.Rule.EditorTier = "advanced"
		in.Rule.SchemaVersion = 2
		in.Rule.Tag = "Avancé"
		if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, in.TenantID, billing.PlanFeatureAdvancedRules); err != nil {
			return nil, err
		}
	}
	if err := requireAdvancedRulesIfNeeded(ctx, uc.Subs, uc.Plans, in.TenantID, []rules.Rule{in.Rule}); err != nil {
		return nil, err
	}
	normalizeRuleForStorage(&in.Rule)
	raw, err := json.Marshal(in.Rule)
	if err != nil {
		return nil, err
	}
	rec := &ports.PointsRuleRecord{
		ID:         uuid.New(),
		TenantID:   in.TenantID,
		RuleJSON:   raw,
		Active:     in.Active,
		Priority:   in.Priority,
		EditorTier: tier,
	}
	if err := uc.Rules.Create(ctx, rec); err != nil {
		return nil, err
	}
	if uc.Versions != nil {
		if err := uc.appendVersion(ctx, in.TenantID, rec, in.ActorID, in.Summary); err != nil {
			return nil, err
		}
	}
	if err := recomputeAndPersist(ctx, uc.Rules, in.TenantID); err != nil {
		return nil, err
	}
	return uc.Rules.FindByID(ctx, in.TenantID, rec.ID)
}

func (uc *CreateStoreRule) appendVersion(ctx context.Context, tenantID uuid.UUID, rec *ports.PointsRuleRecord, actor *uuid.UUID, summary string) error {
	verNum, err := uc.Versions.NextVersionNumber(ctx, rec.ID)
	if err != nil {
		return err
	}
	verID := uuid.New()
	var sum *string
	if summary != "" {
		sum = &summary
	}
	ver := &ports.RuleVersionRecord{
		ID: verID, RuleID: rec.ID, TenantID: tenantID, VersionNumber: verNum,
		RuleJSON: rec.RuleJSON, EditorTier: rec.EditorTier, CreatedBy: actor, ChangeSummary: sum,
	}
	if err := uc.Versions.Create(ctx, ver); err != nil {
		return err
	}
	rec.CurrentVersionID = &verID
	return uc.Rules.Update(ctx, rec)
}

type PatchStoreRule struct {
	Rules    ports.PointsRuleRepository
	Versions ports.RuleVersionRepository
	Subs     ports.SubscriptionRepository
	Plans    ports.PlanCatalogRepository
}

type PatchStoreRuleInput struct {
	TenantID uuid.UUID
	RuleID   uuid.UUID
	Rule     *rules.Rule
	Active   *bool
	Priority *int
	ActorID  *uuid.UUID
	Summary  string
}

func (uc *PatchStoreRule) Execute(ctx context.Context, in PatchStoreRuleInput) (*ports.PointsRuleRecord, error) {
	rec, err := uc.Rules.FindByID(ctx, in.TenantID, in.RuleID)
	if err != nil {
		return nil, err
	}
	if rec.FrozenAt != nil {
		return nil, fmt.Errorf("%w", domain.ErrForbidden)
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
		rec.EditorTier = editorTierForRule(rule)
		if rec.EditorTier == "advanced" {
			if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, in.TenantID, billing.PlanFeatureAdvancedRules); err != nil {
				return nil, err
			}
		}
		if err := requireAdvancedRulesIfNeeded(ctx, uc.Subs, uc.Plans, in.TenantID, []rules.Rule{rule}); err != nil {
			return nil, err
		}
		normalizeRuleForStorage(&rule)
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
	if in.Rule != nil && uc.Versions != nil {
		createUC := &CreateStoreRule{Rules: uc.Rules, Versions: uc.Versions}
		if err := createUC.appendVersion(ctx, in.TenantID, rec, in.ActorID, in.Summary); err != nil {
			return nil, err
		}
	}
	if err := recomputeAndPersist(ctx, uc.Rules, in.TenantID); err != nil {
		return nil, err
	}
	return uc.Rules.FindByID(ctx, in.TenantID, in.RuleID)
}

type DeleteStoreRule struct {
	Rules ports.PointsRuleRepository
}

func (uc *DeleteStoreRule) Execute(ctx context.Context, tenantID, ruleID uuid.UUID) error {
	if err := uc.Rules.Delete(ctx, tenantID, ruleID); err != nil {
		return err
	}
	rules.InvalidateTenantRulesCache(tenantID.String())
	return recomputeAndPersist(ctx, uc.Rules, tenantID)
}

type GetRulesHealth struct {
	Rules ports.PointsRuleRepository
}

type RulesHealthOutput struct {
	HasActiveBaseRule   bool  `json:"has_active_base_rule"`
	ActiveRulesCount    int   `json:"active_rules_count"`
	FrozenAdvancedCount int   `json:"frozen_advanced_count"`
	ProgramActive       bool  `json:"program_active"`
}

func (uc *GetRulesHealth) Execute(ctx context.Context, tenantID uuid.UUID) (*RulesHealthOutput, error) {
	recs, err := uc.Rules.ListByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	parsed, err := recordsToRules(recs)
	if err != nil {
		return nil, err
	}
	activeFlags := make([]bool, len(recs))
	activeCount := 0
	frozenAdvanced := 0
	for i, rec := range recs {
		activeFlags[i] = rec.Active
		if rec.Active && parsed[i].On {
			activeCount++
		}
		if rec.EditorTier == "advanced" && rec.FrozenAt != nil {
			frozenAdvanced++
		}
	}
	hasBase := rules.HasActiveBaseRule(parsed, activeFlags)
	return &RulesHealthOutput{
		HasActiveBaseRule:   hasBase,
		ActiveRulesCount:    activeCount,
		FrozenAdvancedCount: frozenAdvanced,
		ProgramActive:       hasBase,
	}, nil
}

type SimulateStoreRules struct {
	Rules ports.PointsRuleRepository
}

type SimulateStoreRulesInput struct {
	TenantID        uuid.UUID
	AmountFcfa      int64
	OccurredAt      time.Time
	Tier            string
	IsNew           bool
	DraftRules      []rules.Rule
	FallbackDefault bool
}

func (uc *SimulateStoreRules) Execute(ctx context.Context, in SimulateStoreRulesInput) (rules.EvalResult, error) {
	parsed, err := uc.resolveRules(ctx, in)
	if err != nil {
		return rules.EvalResult{}, err
	}
	return rules.EvaluateTransaction(parsed, evalContextFromInput(in)), nil
}

func (uc *SimulateStoreRules) resolveRules(ctx context.Context, in SimulateStoreRulesInput) ([]rules.Rule, error) {
	if len(in.DraftRules) > 0 {
		return in.DraftRules, nil
	}
	parsed, err := uc.loadActiveRules(ctx, in.TenantID, in.FallbackDefault)
	if err != nil {
		return nil, err
	}
	return parsed, nil
}

func (uc *SimulateStoreRules) loadActiveRules(ctx context.Context, tenantID uuid.UUID, fallbackDefault bool) ([]rules.Rule, error) {
	tid := tenantID.String()
	if cached, ok := rules.GetCachedTenantRules(tid); ok {
		return cached, nil
	}
	recs, err := uc.Rules.ListByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	parsed, err := recordsToRules(recs)
	if err != nil {
		return nil, err
	}
	active := activeRules(recs, parsed)
	if len(active) == 0 && fallbackDefault {
		return rules.DefaultPilotRules(), nil
	}
	rules.SetCachedTenantRules(tid, active)
	return active, nil
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
	parsed, err := sim.loadActiveRules(ctx, tenantID, false)
	if err != nil {
		return rules.EvalResult{}, err
	}
	activeFlags := make([]bool, len(parsed))
	for i := range parsed {
		activeFlags[i] = true
	}
	if !rules.HasActiveBaseRule(parsed, activeFlags) {
		return rules.EvalResult{}, fmt.Errorf("%w", domain.ErrLoyaltyInactive)
	}
	return rules.EvaluateTransaction(parsed, rules.EvalContext{
		AmountFcfa: amountFcfa,
		Day:        rules.WeekdayToSimDay(occurredAt),
		Hour:       occurredAt.Hour(),
		Tier:       tier,
	}), nil
}

// EvaluateEnrollmentPoints awards enroll-trigger flat bonuses for a new member.
func EvaluateEnrollmentPoints(ctx context.Context, repo ports.PointsRuleRepository, tenantID uuid.UUID, tier string, occurredAt time.Time) (rules.EvalResult, error) {
	sim := &SimulateStoreRules{Rules: repo}
	parsed, err := sim.loadActiveRules(ctx, tenantID, false)
	if err != nil {
		return rules.EvalResult{}, err
	}
	activeFlags := make([]bool, len(parsed))
	for i := range parsed {
		activeFlags[i] = true
	}
	if !rules.HasActiveBaseRule(parsed, activeFlags) {
		return rules.EvalResult{}, fmt.Errorf("%w", domain.ErrLoyaltyInactive)
	}
	return rules.EvaluateTransaction(parsed, rules.EvalContext{
		Day:   rules.WeekdayToSimDay(occurredAt),
		Hour:  occurredAt.Hour(),
		Tier:  tier,
		IsNew: true,
	}), nil
}
