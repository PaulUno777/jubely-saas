package tenant

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type GetTenantLocales struct {
	Locales ports.TenantSupportedLocaleRepository
}

func (uc *GetTenantLocales) Execute(ctx context.Context, tenantID uuid.UUID) ([]domain.TenantSupportedLocale, error) {
	return uc.Locales.ListByTenant(ctx, tenantID)
}

type PutTenantLocales struct {
	Locales ports.TenantSupportedLocaleRepository
}

type PutTenantLocalesInput struct {
	TenantID uuid.UUID
	Locales  []TenantLocaleInput
}

type TenantLocaleInput struct {
	Locale    string
	IsPrimary bool
	Enabled   bool
}

func (uc *PutTenantLocales) Execute(ctx context.Context, in PutTenantLocalesInput) ([]domain.TenantSupportedLocale, error) {
	if len(in.Locales) == 0 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	primaryCount := 0
	out := make([]domain.TenantSupportedLocale, 0, len(in.Locales))
	seen := map[string]struct{}{}
	for _, row := range in.Locales {
		loc := strings.TrimSpace(row.Locale)
		if loc == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		if _, dup := seen[loc]; dup {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		seen[loc] = struct{}{}
		if row.IsPrimary {
			primaryCount++
		}
		out = append(out, domain.TenantSupportedLocale{
			TenantID:  in.TenantID,
			Locale:    loc,
			IsPrimary: row.IsPrimary,
			Enabled:   row.Enabled,
		})
	}
	if primaryCount != 1 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if err := uc.Locales.ReplaceForTenant(ctx, in.TenantID, out); err != nil {
		return nil, err
	}
	return out, nil
}
