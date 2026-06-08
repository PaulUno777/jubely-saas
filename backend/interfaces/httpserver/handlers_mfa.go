package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) MeListMFA(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	factors, err := s.SetupTOTPUC.Factors.ListByUser(c.Request.Context(), claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(factors))
	for _, f := range factors {
		items = append(items, gin.H{
			"id":           f.ID.String(),
			"type":         string(f.Type),
			"label":        f.Label,
			"enabled_at":   f.EnabledAt,
			"last_used_at": f.LastUsedAt,
			"created_at":   f.CreatedAt,
		})
	}
	respondOK(c, gin.H{"items": items})
}

type setupTOTPBody struct {
	Label *string `json:"label"`
}

func (s *Server) MeSetupTOTP(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body setupTOTPBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.SetupTOTPUC.Execute(c.Request.Context(), auth.SetupTOTPInput{
		UserID: claims.UserID,
		Label:  body.Label,
		Email:  claims.Email,
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{
		"factor_id":   out.FactorID.String(),
		"secret_b32":  out.SecretB32,
		"otpauth_url": out.OTPAuthURL,
	})
}

type confirmTOTPBody struct {
	FactorID string `json:"factor_id"`
	Code     string `json:"code"`
}

func (s *Server) MeConfirmTOTP(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body confirmTOTPBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	id, err := uuid.Parse(body.FactorID)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_factor_id"})
		return
	}
	if err := s.ConfirmTOTPUC.Execute(c.Request.Context(), auth.ConfirmTOTPInput{
		UserID:   claims.UserID,
		FactorID: id,
		Code:     body.Code,
	}); err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{"ok": true})
}

func (s *Server) MeDeleteFactor(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_factor_id"})
		return
	}
	f, err := s.SetupTOTPUC.Factors.FindByID(c.Request.Context(), id)
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	if f.UserID != claims.UserID {
		respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
		return
	}
	if err := s.SetupTOTPUC.Factors.Delete(c.Request.Context(), id); err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{"ok": true})
}
