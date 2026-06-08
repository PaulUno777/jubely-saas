package campaign

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListCampaigns struct {
	Campaigns ports.CampaignRepository
}

type ListCampaignsInput struct {
	TenantID uuid.UUID
	Status   *string
}

func (uc *ListCampaigns) Execute(ctx context.Context, in ListCampaignsInput) ([]domain.Campaign, error) {
	return uc.Campaigns.ListByTenant(ctx, in.TenantID, in.Status)
}

type GetCampaign struct {
	Campaigns ports.CampaignRepository
}

func (uc *GetCampaign) Execute(ctx context.Context, tenantID, campaignID uuid.UUID) (*domain.Campaign, error) {
	return uc.Campaigns.FindByID(ctx, tenantID, campaignID)
}

type CreateCampaign struct {
	Campaigns ports.CampaignRepository
	Subs      ports.SubscriptionRepository
	Plans     ports.PlanCatalogRepository
	Clock     ports.Clock
}

type CampaignMutationInput struct {
	TenantID      uuid.UUID
	Name          string
	CampaignType  string
	StartsAt      *time.Time
	EndsAt        *time.Time
	TargetingJSON json.RawMessage
	ActionJSON    json.RawMessage
	BudgetPoints  *int
}

func (uc *CreateCampaign) Execute(ctx context.Context, in CampaignMutationInput) (*domain.Campaign, error) {
	if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, in.TenantID, billing.PlanFeatureCampaigns); err != nil {
		return nil, err
	}
	c, err := buildCampaignDraft(in, uc.Clock.Now().UTC())
	if err != nil {
		return nil, err
	}
	if err := uc.Campaigns.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

type UpdateCampaign struct {
	Campaigns ports.CampaignRepository
	Subs      ports.SubscriptionRepository
	Plans     ports.PlanCatalogRepository
	Clock     ports.Clock
}

type UpdateCampaignInput struct {
	TenantID      uuid.UUID
	CampaignID    uuid.UUID
	Name          *string
	CampaignType  *string
	StartsAt      *time.Time
	EndsAt        *time.Time
	TargetingJSON *json.RawMessage
	ActionJSON    *json.RawMessage
	BudgetPoints  *int
}

func (uc *UpdateCampaign) Execute(ctx context.Context, in UpdateCampaignInput) (*domain.Campaign, error) {
	if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, in.TenantID, billing.PlanFeatureCampaigns); err != nil {
		return nil, err
	}
	c, err := uc.Campaigns.FindByID(ctx, in.TenantID, in.CampaignID)
	if err != nil {
		return nil, err
	}
	if c.Status != domain.CampaignStatusDraft && c.Status != domain.CampaignStatusScheduled && c.Status != domain.CampaignStatusPaused {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if in.Name != nil {
		n := strings.TrimSpace(*in.Name)
		if n == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.Name = n
	}
	if in.CampaignType != nil {
		t := strings.TrimSpace(*in.CampaignType)
		if t == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.CampaignType = t
	}
	if in.StartsAt != nil {
		c.StartsAt = in.StartsAt
	}
	if in.EndsAt != nil {
		c.EndsAt = in.EndsAt
	}
	if in.TargetingJSON != nil {
		if !json.Valid(*in.TargetingJSON) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.TargetingJSON = append(json.RawMessage(nil), (*in.TargetingJSON)...)
	}
	if in.ActionJSON != nil {
		if !json.Valid(*in.ActionJSON) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.ActionJSON = append(json.RawMessage(nil), (*in.ActionJSON)...)
	}
	if in.BudgetPoints != nil {
		c.BudgetPoints = in.BudgetPoints
	}
	c.UpdatedAt = uc.Clock.Now().UTC()
	if err := uc.Campaigns.Update(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

type LaunchCampaign struct {
	Campaigns ports.CampaignRepository
	Subs      ports.SubscriptionRepository
	Plans     ports.PlanCatalogRepository
	Clock     ports.Clock
}

func (uc *LaunchCampaign) Execute(ctx context.Context, tenantID, campaignID uuid.UUID) (*domain.Campaign, error) {
	if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, tenantID, billing.PlanFeatureCampaigns); err != nil {
		return nil, err
	}
	c, err := uc.Campaigns.FindByID(ctx, tenantID, campaignID)
	if err != nil {
		return nil, err
	}
	if c.Status != domain.CampaignStatusDraft && c.Status != domain.CampaignStatusScheduled && c.Status != domain.CampaignStatusPaused {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	now := uc.Clock.Now().UTC()
	if c.StartsAt != nil && c.StartsAt.After(now) {
		c.Status = domain.CampaignStatusScheduled
	} else {
		c.Status = domain.CampaignStatusLive
	}
	c.UpdatedAt = now
	if err := uc.Campaigns.Update(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

type PauseCampaign struct {
	Campaigns ports.CampaignRepository
	Subs      ports.SubscriptionRepository
	Plans     ports.PlanCatalogRepository
	Clock     ports.Clock
}

func (uc *PauseCampaign) Execute(ctx context.Context, tenantID, campaignID uuid.UUID) (*domain.Campaign, error) {
	if err := billing.RequirePlanFeature(ctx, uc.Subs, uc.Plans, tenantID, billing.PlanFeatureCampaigns); err != nil {
		return nil, err
	}
	c, err := uc.Campaigns.FindByID(ctx, tenantID, campaignID)
	if err != nil {
		return nil, err
	}
	if c.Status != domain.CampaignStatusLive && c.Status != domain.CampaignStatusScheduled {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	c.Status = domain.CampaignStatusPaused
	c.UpdatedAt = uc.Clock.Now().UTC()
	if err := uc.Campaigns.Update(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func buildCampaignDraft(in CampaignMutationInput, now time.Time) (*domain.Campaign, error) {
	name := strings.TrimSpace(in.Name)
	cType := strings.TrimSpace(in.CampaignType)
	if name == "" || cType == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	targeting := in.TargetingJSON
	if len(targeting) == 0 {
		targeting = json.RawMessage(`{}`)
	} else if !json.Valid(targeting) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	action := in.ActionJSON
	if len(action) == 0 {
		action = json.RawMessage(`{}`)
	} else if !json.Valid(action) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	return &domain.Campaign{
		ID:            uuid.New(),
		TenantID:      in.TenantID,
		Name:          name,
		CampaignType:  cType,
		Status:        domain.CampaignStatusDraft,
		StartsAt:      in.StartsAt,
		EndsAt:        in.EndsAt,
		TargetingJSON: targeting,
		ActionJSON:    action,
		BudgetPoints:  in.BudgetPoints,
		CreatedAt:     now,
		UpdatedAt:     now,
	}, nil
}
