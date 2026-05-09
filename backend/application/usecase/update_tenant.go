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

type UpdateTenant struct {
	Tenants ports.TenantRepository
	Clock   ports.Clock
}

type UpdateTenantInput struct {
	TenantID       uuid.UUID
	Name           *string
	Active         *bool
	Plan           *string
	ConflictPolicy *string
	Settings       *json.RawMessage
}

type UpdateTenantOutput struct {
	Tenant *domain.Tenant
}

func (uc *UpdateTenant) Execute(ctx context.Context, in UpdateTenantInput) (*UpdateTenantOutput, error) {
	t, err := uc.Tenants.FindByID(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	if in.Name != nil {
		n := strings.TrimSpace(*in.Name)
		if n == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		t.Name = n
	}
	if in.Active != nil {
		t.Active = *in.Active
	}
	if in.Plan != nil {
		p := strings.TrimSpace(strings.ToLower(*in.Plan))
		if !domain.IsValidTenantPlan(p) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		t.Plan = p
	}
	if in.ConflictPolicy != nil {
		cp := strings.TrimSpace(strings.ToUpper(*in.ConflictPolicy))
		if cp == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		// For now, accept any non-empty string. Phase 4 will enforce a finite set.
		t.ConflictPolicy = cp
	}
	if in.Settings != nil {
		if len(*in.Settings) == 0 {
			t.Settings = json.RawMessage(`{}`)
		} else if !json.Valid(*in.Settings) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		} else {
			t.Settings = append(json.RawMessage(nil), (*in.Settings)...)
		}
	}
	t.UpdatedAt = uc.Clock.Now()
	if err := uc.Tenants.Update(ctx, t); err != nil {
		return nil, err
	}
	return &UpdateTenantOutput{Tenant: t}, nil
}
