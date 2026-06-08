package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

// PublicGetTenantBySlug exposes minimal tenant info + signed store QR for enrollment pages.
func (s *Server) PublicGetTenantBySlug(c *gin.Context) {
	slug := strings.TrimSpace(strings.ToLower(c.Param("slug")))
	if slug == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_slug"})
		return
	}
	t, err := s.GetTenantUC.Execute(c.Request.Context(), tenant.GetTenantInput{Slug: slug})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	if !t.Active {
		respondError(c, http.StatusNotFound, i18n.CodeTenantNotFound, nil)
		return
	}
	token, err := s.signEnrollmentStoreQR(c, t.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	g := presenter.Tenant(t)
	respondOK(c, gin.H{
		"tenant_id": g["tenant_id"],
		"name":      g["name"],
		"slug":      g["slug"],
		"logo_url":  g["logo_url"],
		"store_qr":  token,
	})
}
