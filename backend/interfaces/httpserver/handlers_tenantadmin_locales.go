package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

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
