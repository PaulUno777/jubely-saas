package httpserver

import (
	"crypto/sha256"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) InvitationPreview(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	if token == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeInvitationInvalid, gin.H{"reason": "missing_token"})
		return
	}
	sum := sha256.Sum256([]byte(token))
	inv, err := s.Invitations.FindByTokenHash(c.Request.Context(), sum[:])
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			respondError(c, http.StatusBadRequest, i18n.CodeInvitationInvalid, gin.H{"reason": "not_found"})
			return
		}
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}

	now := time.Now().UTC()
	if inv.AcceptedAt != nil {
		respondOK(c, gin.H{"valid": false, "code": i18n.CodeInvitationAlreadyAccepted})
		return
	}
	if !now.Before(inv.ExpiresAt) {
		respondOK(c, gin.H{"valid": false, "code": i18n.CodeInvitationExpired})
		return
	}

	t, err := s.Tenants.FindByID(c.Request.Context(), inv.TenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}

	respondOK(c, gin.H{
		"valid":        true,
		"tenant_name":  t.Name,
		"email_masked": maskEmail(inv.Email),
		"expires_at":   inv.ExpiresAt,
		"role":         inv.Role.String(),
	})
}

type acceptInvitationBody struct {
	Password string `json:"password"`
}

func (s *Server) PostAcceptInvitation(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	var body acceptInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.AcceptInvitationUC.Execute(c.Request.Context(), usecase.AcceptMerchantInvitationInput{
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

func maskEmail(email string) string {
	email = strings.TrimSpace(strings.ToLower(email))
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	name := parts[0]
	domainPart := parts[1]
	if name == "" {
		return "***@" + domainPart
	}
	if len(name) == 1 {
		return "*" + "***@" + domainPart
	}
	return string(name[0]) + "***@" + domainPart
}
