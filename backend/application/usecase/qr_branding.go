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

// QRFicheCopyFieldKeys are localized_strings.field_key values for printable fiche copy.
var QRFicheCopyFieldKeys = []string{
	"headline", "tagline", "cta", "join", "how", "reward", "rewardSub", "tiers", "powered",
}

type GetQRBranding struct {
	Branding ports.QRBrandingRepository
	Strings  ports.LocalizedStringRepository
}

type GetQRBrandingOutput struct {
	Branding *domain.TenantQRBranding
	Copy     map[string]map[string]string
}

func (uc *GetQRBranding) Execute(ctx context.Context, tenantID uuid.UUID) (*GetQRBrandingOutput, error) {
	branding, err := uc.Branding.FindByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	copyByLocale := map[string]map[string]string{}
	if uc.Strings != nil {
		rows, err := uc.Strings.ListByOwner(ctx, domain.LocalizedOwnerQRFiche, tenantID)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			if copyByLocale[row.Locale] == nil {
				copyByLocale[row.Locale] = map[string]string{}
			}
			copyByLocale[row.Locale][row.FieldKey] = row.Value
		}
	}
	return &GetQRBrandingOutput{Branding: branding, Copy: copyByLocale}, nil
}

type PutQRBranding struct {
	Branding ports.QRBrandingRepository
	Strings  ports.LocalizedStringRepository
	Clock    ports.Clock
}

type PutQRBrandingInput struct {
	TenantID       uuid.UUID
	Variant        string
	Theme          string
	AccentColor    string
	FontFamily     string
	HeadingFont    *string
	QRForeground   *string
	QRBackground   *string
	LayoutJSON     json.RawMessage
	SectionToggles json.RawMessage
	Copy           map[string]map[string]string
}

func (uc *PutQRBranding) Execute(ctx context.Context, in PutQRBrandingInput) (*GetQRBrandingOutput, error) {
	variant := strings.TrimSpace(in.Variant)
	if variant == "" {
		variant = "affiche"
	}
	theme := strings.TrimSpace(in.Theme)
	if theme == "" {
		theme = "dark"
	}
	accent := strings.TrimSpace(in.AccentColor)
	if accent == "" {
		accent = "#C89B3C"
	}
	font := strings.TrimSpace(in.FontFamily)
	if font == "" {
		font = "manrope"
	}
	layout := in.LayoutJSON
	if len(layout) == 0 {
		layout = json.RawMessage(`{}`)
	} else if !json.Valid(layout) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	toggles := in.SectionToggles
	if len(toggles) == 0 {
		toggles = json.RawMessage(`{"logo":true,"how":true,"tiers":true,"reward":true,"contact":true}`)
	} else if !json.Valid(toggles) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	now := uc.Clock.Now().UTC()
	branding := &domain.TenantQRBranding{
		TenantID:       in.TenantID,
		Variant:        variant,
		Theme:          theme,
		AccentColor:    accent,
		FontFamily:     font,
		HeadingFont:    in.HeadingFont,
		QRForeground:   in.QRForeground,
		QRBackground:   in.QRBackground,
		LayoutJSON:     layout,
		SectionToggles: toggles,
		UpdatedAt:      now,
	}
	if err := uc.Branding.Upsert(ctx, branding); err != nil {
		return nil, err
	}
	if uc.Strings != nil && len(in.Copy) > 0 {
		for locale, fields := range in.Copy {
			loc := strings.TrimSpace(locale)
			if loc == "" {
				continue
			}
			for key, value := range fields {
				k := strings.TrimSpace(key)
				if k == "" {
					continue
				}
				s := &domain.LocalizedString{
					ID:        uuid.New(),
					OwnerType: domain.LocalizedOwnerQRFiche,
					OwnerID:   in.TenantID,
					FieldKey:  k,
					Locale:    loc,
					Value:     value,
					CreatedAt: now,
					UpdatedAt: now,
				}
				if err := uc.Strings.Upsert(ctx, s); err != nil {
					return nil, err
				}
			}
		}
	}
	get := &GetQRBranding{Branding: uc.Branding, Strings: uc.Strings}
	return get.Execute(ctx, in.TenantID)
}
