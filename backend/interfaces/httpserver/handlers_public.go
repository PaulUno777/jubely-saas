package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type storeSignupBody struct {
	TenantName string `json:"tenant_name"`
	TenantSlug string `json:"tenant_slug"`
	Plan       string `json:"plan"`
	LogoURL    string `json:"logo_url"`

	AdminEmail    string `json:"admin_email"`
	AdminPassword string `json:"admin_password"`
}

func (s *Server) PublicStoreSignup(c *gin.Context) {
	var body storeSignupBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}

	out, err := s.StoreSignupUC.Execute(c.Request.Context(), tenant.StoreSignupInput{
		TenantName:    body.TenantName,
		TenantSlug:    body.TenantSlug,
		Plan:          body.Plan,
		LogoURL:       strings.TrimSpace(body.LogoURL),
		AdminEmail:    body.AdminEmail,
		AdminPassword: body.AdminPassword,
	})
	if err != nil {
		switch {
		case err == domain.ErrEmailTaken:
			respondError(c, http.StatusConflict, i18n.CodeUserEmailTaken, gin.H{"reason": "email_taken"})
		case err == domain.ErrConflict:
			respondError(c, http.StatusConflict, i18n.CodeTenantSlugTaken, gin.H{"reason": "slug_taken"})
		case err == domain.ErrInvalid:
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_input"})
		default:
			respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		}
		return
	}

	respondCreated(c, gin.H{
		"tenant_id":    out.TenantID.String(),
		"tenant_slug":  out.TenantSlug,
		"user_id":      out.UserID.String(),
		"access_token": out.AccessToken,
	})
}
