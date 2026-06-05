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

type ListTiers struct {
	Tiers ports.LoyaltyTierRepository
}

func (uc *ListTiers) Execute(ctx context.Context, tenantID uuid.UUID) ([]domain.LoyaltyTier, error) {
	return uc.Tiers.ListByTenant(ctx, tenantID, false)
}

type UpsertTier struct {
	Tiers ports.LoyaltyTierRepository
	Clock ports.Clock
}

type UpsertTierInput struct {
	TenantID     uuid.UUID
	ID           *uuid.UUID
	Code         string
	SortOrder    int
	MinPoints    int
	Color        string
	IconKey      *string
	AutoUpgrade  bool
	BenefitsJSON json.RawMessage
	Active       bool
}

func (uc *UpsertTier) Execute(ctx context.Context, in UpsertTierInput) (*domain.LoyaltyTier, error) {
	code := strings.TrimSpace(strings.ToLower(in.Code))
	if code == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	color := strings.TrimSpace(in.Color)
	if color == "" {
		color = "#B07A4A"
	}
	benefits := in.BenefitsJSON
	if len(benefits) == 0 {
		benefits = json.RawMessage(`{}`)
	} else if !json.Valid(benefits) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	now := uc.Clock.Now().UTC()
	tier := &domain.LoyaltyTier{
		ID:           uuid.New(),
		TenantID:     in.TenantID,
		Code:         code,
		SortOrder:    in.SortOrder,
		MinPoints:    in.MinPoints,
		Color:        color,
		IconKey:      in.IconKey,
		AutoUpgrade:  in.AutoUpgrade,
		BenefitsJSON: benefits,
		Active:       in.Active,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if in.ID != nil && *in.ID != uuid.Nil {
		existing, err := uc.Tiers.FindByID(ctx, in.TenantID, *in.ID)
		if err != nil {
			return nil, err
		}
		tier.ID = existing.ID
		tier.CreatedAt = existing.CreatedAt
		if err := uc.Tiers.Update(ctx, tier); err != nil {
			return nil, err
		}
		return tier, nil
	}
	if err := uc.Tiers.Create(ctx, tier); err != nil {
		return nil, err
	}
	return tier, nil
}

type SeedDefaultTiers struct {
	Tiers ports.LoyaltyTierRepository
	Clock ports.Clock
}

var defaultTierSeed = []struct {
	code      string
	sortOrder int
	minPoints int
	color     string
}{
	{"bronze", 0, 0, "#B07A4A"},
	{"silver", 1, 500, "#9AA0A6"},
	{"gold", 2, 1500, "#C89B3C"},
	{"platinum", 3, 5000, "#0F766E"},
}

func (uc *SeedDefaultTiers) Execute(ctx context.Context, tenantID uuid.UUID) ([]domain.LoyaltyTier, error) {
	existing, err := uc.Tiers.ListByTenant(ctx, tenantID, false)
	if err != nil {
		return nil, err
	}
	if len(existing) > 0 {
		return existing, nil
	}
	now := uc.Clock.Now().UTC()
	out := make([]domain.LoyaltyTier, 0, len(defaultTierSeed))
	for _, def := range defaultTierSeed {
		t := domain.LoyaltyTier{
			ID:           uuid.New(),
			TenantID:     tenantID,
			Code:         def.code,
			SortOrder:    def.sortOrder,
			MinPoints:    def.minPoints,
			Color:        def.color,
			AutoUpgrade:  true,
			BenefitsJSON: json.RawMessage(`{}`),
			Active:       true,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if err := uc.Tiers.Create(ctx, &t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, nil
}
