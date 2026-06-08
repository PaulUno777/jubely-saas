package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantGetQRBranding(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.GetQRBrandingUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.QRBranding(out))
}

type tenantPutQRBrandingBody struct {
	Variant        string                       `json:"variant"`
	Theme          string                       `json:"theme"`
	AccentColor    string                       `json:"accent_color"`
	FontFamily     string                       `json:"font_family"`
	HeadingFont    *string                      `json:"heading_font"`
	QRForeground   *string                      `json:"qr_foreground"`
	QRBackground   *string                      `json:"qr_background"`
	LayoutJSON     json.RawMessage              `json:"layout_json"`
	SectionToggles json.RawMessage              `json:"section_toggles"`
	Copy           map[string]map[string]string `json:"copy"`
}

func (s *Server) TenantPutQRBranding(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantPutQRBrandingBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.PutQRBrandingUC.Execute(c.Request.Context(), tenant.PutQRBrandingInput{
		TenantID:       tenantID,
		Variant:        body.Variant,
		Theme:          body.Theme,
		AccentColor:    body.AccentColor,
		FontFamily:     body.FontFamily,
		HeadingFont:    body.HeadingFont,
		QRForeground:   body.QRForeground,
		QRBackground:   body.QRBackground,
		LayoutJSON:     body.LayoutJSON,
		SectionToggles: body.SectionToggles,
		Copy:           body.Copy,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.QRBranding(out))
}

func (s *Server) TenantGetStoreQR(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var locationID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return
		}
		locationID = &id
	}
	token, err := s.GetEnrollmentQRUC.Execute(c.Request.Context(), loyalty.GetEnrollmentQRInput{
		TenantID:   tenantID,
		LocationID: locationID,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	payload := gin.H{"store_qr": token}
	if locationID != nil {
		payload["location_id"] = locationID.String()
	}
	respondOK(c, payload)
}

func (s *Server) TenantGetLocales(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	locales, err := s.GetTenantLocalesUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(locales))
	for _, l := range locales {
		items = append(items, gin.H{
			"locale":     l.Locale,
			"is_primary": l.IsPrimary,
			"enabled":    l.Enabled,
		})
	}
	respondOK(c, gin.H{"locales": items})
}

type tenantPutLocalesBody struct {
	Locales []struct {
		Locale    string `json:"locale"`
		IsPrimary bool   `json:"is_primary"`
		Enabled   bool   `json:"enabled"`
	} `json:"locales"`
}

func (s *Server) TenantPutLocales(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantPutLocalesBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	in := make([]tenant.TenantLocaleInput, 0, len(body.Locales))
	for _, row := range body.Locales {
		in = append(in, tenant.TenantLocaleInput{
			Locale:    row.Locale,
			IsPrimary: row.IsPrimary,
			Enabled:   row.Enabled,
		})
	}
	locales, err := s.PutTenantLocalesUC.Execute(c.Request.Context(), tenant.PutTenantLocalesInput{
		TenantID: tenantID,
		Locales:  in,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(locales))
	for _, l := range locales {
		items = append(items, gin.H{
			"locale":     l.Locale,
			"is_primary": l.IsPrimary,
			"enabled":    l.Enabled,
		})
	}
	respondOK(c, gin.H{"locales": items})
}
