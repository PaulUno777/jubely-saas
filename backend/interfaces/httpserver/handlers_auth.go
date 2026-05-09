package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type bootstrapBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) BootstrapSuperadmin(c *gin.Context) {
	var body bootstrapBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	err := s.BootstrapUC.Execute(c.Request.Context(), usecase.BootstrapSuperadminInput{
		HeaderSecret: c.GetHeader("X-Bootstrap-Secret"),
		Email:        body.Email,
		Password:     body.Password,
	})
	if err != nil {
		respondMapped(c, mapBootstrapError(err))
		return
	}
	respondCreated(c, gin.H{"code": i18n.CodeBootstrapSuperadminCreated})
}

type loginBody struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	TenantSlug string `json:"tenant_slug"`
}

func (s *Server) AuthLogin(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.LoginUC.Execute(c.Request.Context(), usecase.LoginInput{
		Email:      body.Email,
		Password:   body.Password,
		TenantSlug: body.TenantSlug,
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	if out.Step == "mfa_required" {
		respondOK(c, gin.H{
			"step":                 out.Step,
			"challenge_token":      out.ChallengeToken,
			"methods":              out.Methods,
			"user_id":              out.UserID.String(),
			"tenant_id":            out.TenantID,
			"role":                 out.Role.String(),
			"email":                out.Email,
			"must_change_password": out.MustChangePassword,
		})
		return
	}
	respondOK(c, gin.H{
		"step":                 out.Step,
		"access_token":         out.AccessToken,
		"refresh_token":        out.RefreshToken,
		"user_id":              out.UserID.String(),
		"tenant_id":            out.TenantID,
		"role":                 out.Role.String(),
		"email":                out.Email,
		"must_change_password": out.MustChangePassword,
	})
}

type refreshBody struct {
	RefreshToken string `json:"refresh_token"`
}

type mfaTOTPVerifyBody struct {
	ChallengeToken string `json:"challenge_token"`
	Code           string `json:"code"`
}

func (s *Server) AuthMFATOTPVerify(c *gin.Context) {
	var body mfaTOTPVerifyBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.VerifyTOTPLoginUC.Execute(c.Request.Context(), usecase.VerifyLoginTOTPInput{
		ChallengeToken: body.ChallengeToken,
		Code:           body.Code,
		UserAgent:      c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{
		"step":                 "ok",
		"access_token":         out.AccessToken,
		"refresh_token":        out.RefreshToken,
		"user_id":              out.UserID.String(),
		"tenant_id":            out.TenantID,
		"role":                 out.Role.String(),
		"email":                out.Email,
		"must_change_password": out.MustChangePassword,
	})
}

func (s *Server) AuthRefresh(c *gin.Context) {
	var body refreshBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.RefreshUC.Execute(c.Request.Context(), usecase.RefreshAuthInput{
		RefreshToken: body.RefreshToken,
		UserAgent:    c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{
		"access_token":         out.AccessToken,
		"refresh_token":        out.RefreshToken,
		"user_id":              out.UserID.String(),
		"tenant_id":            out.TenantID,
		"role":                 out.Role.String(),
		"email":                out.Email,
		"must_change_password": out.MustChangePassword,
	})
}

func (s *Server) AuthLogout(c *gin.Context) {
	var body refreshBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if err := s.LogoutUC.Execute(c.Request.Context(), usecase.LogoutInput{RefreshToken: body.RefreshToken}); err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{"ok": true})
}
