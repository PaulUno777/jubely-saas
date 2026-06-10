package loyalty

import (
	"context"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type freezeRulesRepo struct {
	frozen bool
}

func (f *freezeRulesRepo) ListByTenant(context.Context, uuid.UUID) ([]ports.PointsRuleRecord, error) {
	return nil, nil
}

func (f *freezeRulesRepo) FindByID(context.Context, uuid.UUID, uuid.UUID) (*ports.PointsRuleRecord, error) {
	return nil, domain.ErrNotFound
}

func (f *freezeRulesRepo) Create(context.Context, *ports.PointsRuleRecord) error { return nil }

func (f *freezeRulesRepo) Update(context.Context, *ports.PointsRuleRecord) error { return nil }

func (f *freezeRulesRepo) Delete(context.Context, uuid.UUID, uuid.UUID) error { return nil }

func (f *freezeRulesRepo) FreezeAdvancedByTenant(_ context.Context, _ uuid.UUID, _ string) error {
	f.frozen = true
	return nil
}

func (f *freezeRulesRepo) RecomputePriorities(context.Context, uuid.UUID, map[uuid.UUID]int) error {
	return nil
}

type freezePlanRepo struct {
	plans map[string]*domain.PlanCatalog
}

func (p *freezePlanRepo) ListActive(context.Context) ([]domain.PlanCatalog, error) { return nil, nil }

func (p *freezePlanRepo) FindByCode(_ context.Context, code string) (*domain.PlanCatalog, error) {
	if plan, ok := p.plans[code]; ok {
		return plan, nil
	}
	return nil, domain.ErrNotFound
}

type freezeSubRepo struct{}

func (s *freezeSubRepo) Create(context.Context, *domain.Subscription) error { return nil }

func (s *freezeSubRepo) FindByOrganization(context.Context, uuid.UUID) (*domain.Subscription, error) {
	return &domain.Subscription{PlanCode: "growth"}, nil
}

func (s *freezeSubRepo) FindByStripeSubscriptionID(context.Context, string) (*domain.Subscription, error) {
	return nil, domain.ErrNotFound
}

func (s *freezeSubRepo) Update(context.Context, *domain.Subscription) error { return nil }

func TestFreezeAdvancedRulesOnDowngrade_standardPlan(t *testing.T) {
	repo := &freezeRulesRepo{}
	uc := &FreezeAdvancedRulesOnDowngrade{
		Rules: repo,
		Subs:  &freezeSubRepo{},
		Plans: &freezePlanRepo{plans: map[string]*domain.PlanCatalog{
			"standard": {Code: "standard", Features: []byte(`{"advanced_rules":false}`)},
		}},
	}
	if err := uc.Execute(context.Background(), uuid.New(), "standard"); err != nil {
		t.Fatal(err)
	}
	if !repo.frozen {
		t.Fatal("expected advanced rules frozen")
	}
}
