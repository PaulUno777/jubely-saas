package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateTenant struct {
	Tenants   ports.TenantRepository
	Provision *ProvisionOrganization
	Clock     ports.Clock
}

type CreateTenantInput struct {
	Name string
	Slug string
	// SelfServe defaults to false at DB level; explicit for API documentation / future toggles.
	SelfServe bool
	// Plan is one of starter | growth | business (Phase 1). Empty defaults to starter.
	Plan string
	// Settings optional JSON object (e.g. logo_url, city). Nil or empty → {}.
	Settings *json.RawMessage
}

type CreateTenantOutput struct {
	Tenant *domain.Tenant
}

func slugify(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	s = strings.ReplaceAll(s, " ", "-")
	return s
}

func (uc *CreateTenant) Execute(ctx context.Context, in CreateTenantInput) (*CreateTenantOutput, error) {
	name := strings.TrimSpace(in.Name)
	slug := slugify(in.Slug)
	if name == "" || slug == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	plan := strings.TrimSpace(strings.ToLower(in.Plan))
	if plan == "" {
		plan = "starter"
	}
	if !domain.IsValidTenantPlan(plan) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	now := uc.Clock.Now()
	settings := json.RawMessage(`{}`)
	if in.Settings != nil && len(*in.Settings) > 0 {
		if !json.Valid(*in.Settings) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		settings = append(json.RawMessage(nil), (*in.Settings)...)
	}
	t := &domain.Tenant{
		ID:             uuid.New(),
		Name:           name,
		Slug:           slug,
		SelfServe:      in.SelfServe, // MVP Option 2: callers pass false; Phase 3 can pass true.
		Active:         true,
		Plan:           plan,
		ConflictPolicy: "HIGHEST_WINS",
		Settings:       settings,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := uc.Tenants.Create(ctx, t); err != nil {
		return nil, err
	}
	if uc.Provision != nil {
		trialPlan := plan
		if trialPlan == "starter" {
			trialPlan = "growth"
		}
		if err := uc.Provision.Execute(ctx, t.ID, t.Name, t.Slug, trialPlan); err != nil {
			return nil, err
		}
	}
	return &CreateTenantOutput{Tenant: t}, nil
}
