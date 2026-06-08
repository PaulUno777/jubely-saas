package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type customerAuthLoginBody struct {
	PhoneVerifyToken string `json:"phone_verify_token"`
}

func (s *Server) CustomerAuthLogin(c *gin.Context) {
	var body customerAuthLoginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.CustomerLoginUC.Execute(c.Request.Context(), auth.CustomerLoginInput{
		PhoneVerifyToken: body.PhoneVerifyToken,
		UserAgent:        c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, authDataFromResult("ok", out.AccessToken, out.RefreshToken, out.UserID, nil, nil, out.Role, out.Email, false, out.Workspaces, out.CustomerID, out.ActiveEnrollmentID, out.Enrollments, nil))
}

type customerSelectSessionBody struct {
	EnrollmentID string `json:"enrollment_id"`
}

func (s *Server) CustomerSelectSession(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body customerSelectSessionBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	enrollmentID, err := uuid.Parse(strings.TrimSpace(body.EnrollmentID))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_enrollment_id"})
		return
	}
	out, err := s.SelectCustomerContextUC.Execute(c.Request.Context(), auth.SelectCustomerContextInput{
		UserID:             claims.UserID,
		EnrollmentID:       enrollmentID,
		ActiveMembershipID: claims.MembershipID,
		UserAgent:          c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, authDataFromResult("ok", out.AccessToken, out.RefreshToken, out.UserID, claims.MembershipID, claims.TenantID, out.Role, out.Email, false, out.Workspaces, out.CustomerID, out.ActiveEnrollmentID, out.Enrollments, nil))
}
