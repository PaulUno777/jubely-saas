package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"errors"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) InvitationPreview(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	out, err := s.PreviewInvitationUC.Execute(c.Request.Context(), tenant.PreviewInvitationInput{Token: token})
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) || errors.Is(err, domain.ErrInvalid) {
			respondError(c, http.StatusBadRequest, i18n.CodeInvitationInvalid, gin.H{"reason": "not_found"})
			return
		}
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	if !out.Valid {
		respondOK(c, gin.H{"valid": false, "code": out.Code})
		return
	}
	respondOK(c, gin.H{
		"valid":        true,
		"tenant_name":  out.TenantName,
		"tenant_slug":  out.TenantSlug,
		"email_masked": out.EmailMasked,
		"expires_at":   out.ExpiresAt,
		"role":         out.Role,
	})
}

type patchInvitationBody struct {
	Status   string `json:"status"`
	Password string `json:"password"`
}

func (s *Server) PatchInvitation(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	var body patchInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if strings.TrimSpace(body.Status) != "accepted" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "unsupported_status"})
		return
	}
	out, err := s.AcceptInvitationUC.Execute(c.Request.Context(), tenant.AcceptMerchantInvitationInput{
		Token:    token,
		Password: body.Password,
	})
	if err != nil {
		respondMapped(c, mapPublicInvitationError(err))
		return
	}
	respondCreated(c, gin.H{
		"user_id":   out.UserID.String(),
		"tenant_id": out.TenantID.String(),
	})
}
