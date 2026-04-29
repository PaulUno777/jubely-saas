package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateTenant struct {
	Tenants ports.TenantRepository
	Clock   ports.Clock
}

type CreateTenantInput struct {
	Name string
	Slug string
	// SelfServe defaults to false at DB level; explicit for API documentation / future toggles.
	SelfServe bool
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
	now := uc.Clock.Now()
	t := &domain.Tenant{
		ID:        uuid.New(),
		Name:      name,
		Slug:      slug,
		SelfServe: in.SelfServe, // MVP Option 2: callers pass false; Phase 3 can pass true.
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := uc.Tenants.Create(ctx, t); err != nil {
		return nil, err
	}
	return &CreateTenantOutput{Tenant: t}, nil
}
