package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type publicOTPSendBody struct {
	PhoneE164 string `json:"phone_e164"`
}

func (s *Server) PublicPhoneVerificationCreate(c *gin.Context) {
	if s.PublicCustomerOTP == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, nil)
		return
	}
	var body publicOTPSendBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.PublicCustomerOTP.Send(c.Request.Context(), auth.PublicCustomerOTPSendInput{PhoneE164: body.PhoneE164})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{"id": out.ID, "sent": true})
}

type publicOTPConfirmBody struct {
	Code string `json:"code"`
}

func (s *Server) PublicPhoneVerificationConfirm(c *gin.Context) {
	if s.PublicCustomerOTP == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, nil)
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_verification_id"})
		return
	}
	var body publicOTPConfirmBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.PublicCustomerOTP.Verify(c.Request.Context(), auth.PublicCustomerOTPVerifyInput{
		VerificationID: id,
		Code:           body.Code,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"phone_verify_token": out.PhoneVerifyToken})
}
