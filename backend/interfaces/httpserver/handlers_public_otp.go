package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type publicOTPSendBody struct {
	PhoneE164 string `json:"phone_e164"`
}

func (s *Server) PublicOTPSend(c *gin.Context) {
	if s.PublicCustomerOTP == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, nil)
		return
	}
	var body publicOTPSendBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if err := s.PublicCustomerOTP.Send(c.Request.Context(), usecase.PublicCustomerOTPSendInput{PhoneE164: body.PhoneE164}); err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"sent": true})
}

type publicOTPVerifyBody struct {
	PhoneE164 string `json:"phone_e164"`
	Code      string `json:"code"`
}

func (s *Server) PublicOTPVerify(c *gin.Context) {
	if s.PublicCustomerOTP == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, nil)
		return
	}
	var body publicOTPVerifyBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.PublicCustomerOTP.Verify(c.Request.Context(), usecase.PublicCustomerOTPVerifyInput{
		PhoneE164: body.PhoneE164,
		Code:      body.Code,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"phone_verify_token": out.PhoneVerifyToken})
}
