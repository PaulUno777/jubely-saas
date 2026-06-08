package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type changePasswordBody struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (s *Server) MeChangePassword(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body changePasswordBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if err := s.ChangePasswordUC.Execute(c.Request.Context(), auth.ChangePasswordInput{
		UserID:          claims.UserID,
		CurrentPassword: body.CurrentPassword,
		NewPassword:     body.NewPassword,
	}); err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{"ok": true})
}
