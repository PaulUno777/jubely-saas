package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) MePasskeyRegisterBegin(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	out, err := s.BeginPasskeyRegUC.Execute(c.Request.Context(), auth.BeginPasskeyRegistrationInput{
		UserID: claims.UserID,
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{
		"challenge_id": out.ChallengeID.String(),
		"options":      out.Options,
	})
}

type mePasskeyFinishBody struct {
	ChallengeID string  `json:"challenge_id"`
	Label       *string `json:"label"`
}

func (s *Server) MePasskeyRegisterFinish(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	raw, err := c.GetRawData()
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	// Parse out challenge_id and label, but keep raw for WebAuthn parsing too.
	var meta mePasskeyFinishBody
	if err := json.Unmarshal(raw, &meta); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	chID, err := uuid.Parse(meta.ChallengeID)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_challenge_id"})
		return
	}

	c.Request.Body = io.NopCloser(bytes.NewReader(raw))
	if err := s.FinishPasskeyRegUC.Execute(c.Request.Context(), auth.FinishPasskeyRegistrationInput{
		UserID:      claims.UserID,
		ChallengeID: chID,
		Label:       meta.Label,
		Request:     c.Request,
	}); err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{"ok": true})
}

type authPasskeyBeginBody struct {
	ChallengeToken string `json:"challenge_token"`
}

func (s *Server) AuthPasskeyBegin(c *gin.Context) {
	var body authPasskeyBeginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	claims, err := s.MFASigner.ParseMFAChallengeToken(c.Request.Context(), body.ChallengeToken)
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	out, err := s.BeginPasskeyAuthUC.Execute(c.Request.Context(), auth.BeginPasskeyAuthenticationInput{
		UserID: claims.UserID,
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{
		"challenge_id": out.ChallengeID.String(),
		"options":      out.Options,
	})
}

type authPasskeyFinishMeta struct {
	ChallengeID    string `json:"challenge_id"`
	ChallengeToken string `json:"challenge_token"`
}

func (s *Server) AuthPasskeyFinish(c *gin.Context) {
	raw, err := c.GetRawData()
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var meta authPasskeyFinishMeta
	if err := json.Unmarshal(raw, &meta); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	chID, err := uuid.Parse(meta.ChallengeID)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_challenge_id"})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(raw))
	out, err := s.FinishPasskeyLoginUC.Execute(c.Request.Context(), auth.FinishLoginPasskeyInput{
		ChallengeToken: meta.ChallengeToken,
		ChallengeID:    chID,
		Request:        c.Request,
		UserAgent:      c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, authDataFromResult(
		out.Step,
		out.AccessToken,
		out.RefreshToken,
		out.UserID,
		out.MembershipID,
		out.TenantID,
		out.Role,
		out.Email,
		out.MustChangePassword,
		out.Workspaces,
		out.CustomerID,
		out.ActiveEnrollmentID,
		out.Enrollments,
		gin.H{
			"required":          false,
			"methods":           []string{},
			"enrolled_factors":  1,
			"setup_recommended": false,
		},
	))
}
