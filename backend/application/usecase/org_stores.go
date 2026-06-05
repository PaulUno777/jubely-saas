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

type ListOrgStores struct {
	Stores ports.StoreRepository
}

func (uc *ListOrgStores) Execute(ctx context.Context, tenantID uuid.UUID) ([]domain.Store, error) {
	return uc.Stores.ListByOrganization(ctx, tenantID)
}

type CreateOrgStore struct {
	Stores ports.StoreRepository
	Quota  *QuotaChecker
	Clock  ports.Clock
}

type CreateOrgStoreInput struct {
	TenantID    uuid.UUID
	Slug        string
	Name        string
	CountryCode string
	StateCode   string
	City        string
	AddressLine string
	Lat         *float64
	Lng         *float64
	Status      domain.StoreStatus
	Timezone    string
}

func (uc *CreateOrgStore) Execute(ctx context.Context, in CreateOrgStoreInput) (*domain.Store, error) {
	if uc.Quota != nil {
		if err := uc.Quota.CanCreateStore(ctx, in.TenantID); err != nil {
			return nil, err
		}
	}
	slug := strings.TrimSpace(strings.ToLower(in.Slug))
	name := strings.TrimSpace(in.Name)
	cc := strings.ToUpper(strings.TrimSpace(in.CountryCode))
	if slug == "" || name == "" || len(cc) != 2 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	status := in.Status
	if status == "" {
		status = domain.StoreStatusOpen
	}
	tz := strings.TrimSpace(in.Timezone)
	if tz == "" {
		tz = "Africa/Douala"
	}
	now := uc.Clock.Now().UTC()
	s := &domain.Store{
		ID:          uuid.New(),
		TenantID:    in.TenantID,
		Slug:        slug,
		Name:        name,
		CountryCode: cc,
		StateCode:   strings.TrimSpace(in.StateCode),
		City:        strings.TrimSpace(in.City),
		AddressLine: strings.TrimSpace(in.AddressLine),
		Lat:         in.Lat,
		Lng:         in.Lng,
		Status:      status,
		IsHQ:        false,
		Timezone:    tz,
		Settings:    json.RawMessage(`{}`),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := uc.Stores.Create(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}
