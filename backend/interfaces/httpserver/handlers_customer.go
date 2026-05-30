package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type publicCreateEnrollmentBody struct {
	StoreQR          string  `json:"store_qr"`
	PhoneE164        string  `json:"phone_e164"`
	Name             string  `json:"name"`
	Email            *string `json:"email"`
	PhoneVerifyToken string  `json:"phone_verify_token"`
}

func (s *Server) PublicCreateEnrollment(c *gin.Context) {
	var body publicCreateEnrollmentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var authUserID *uuid.UUID
	if claims, ok := s.optionalAuthClaims(c); ok {
		authUserID = &claims.UserID
	}
	out, err := s.EnrollByStoreQRUC.Execute(c.Request.Context(), usecase.EnrollByStoreQRInput{
		StoreQR:          body.StoreQR,
		PhoneE164:        body.PhoneE164,
		Name:             body.Name,
		Email:            body.Email,
		PhoneVerifyToken: body.PhoneVerifyToken,
		AuthUserID:       authUserID,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{
		"tenant_id":     out.TenantID.String(),
		"customer_id":   out.CustomerID.String(),
		"enrollment_id": out.EnrollmentID.String(),
		"customer_qr":   out.CustomerQR,
	})
}

func customerQRFromQuery(c *gin.Context) string {
	return strings.TrimSpace(c.Query("customer_qr"))
}

func (s *Server) optionalAuthClaims(c *gin.Context) (ports.TokenClaims, bool) {
	if s.AccessSigner == nil {
		return ports.TokenClaims{}, false
	}
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return ports.TokenClaims{}, false
	}
	raw := strings.TrimSpace(auth[7:])
	if raw == "" {
		return ports.TokenClaims{}, false
	}
	claims, err := s.AccessSigner.ParseAccessToken(c.Request.Context(), raw)
	if err != nil {
		return ports.TokenClaims{}, false
	}
	return claims, true
}

func (s *Server) respondCustomerWallet(c *gin.Context, out *usecase.GetCustomerWalletOutput) {
	events := make([]gin.H, 0, len(out.RecentEvents))
	for _, e := range out.RecentEvents {
		events = append(events, gin.H{
			"event_id":   e.EventID.String(),
			"event_type": e.EventType,
			"delta":      e.Delta,
			"payload":    e.Payload,
			"created_at": e.CreatedAt,
		})
	}
	respondOK(c, gin.H{
		"tenant_id":      out.TenantID.String(),
		"tenant_name":    out.TenantName,
		"tenant_slug":    out.TenantSlug,
		"customer_id":    out.CustomerID.String(),
		"enrollment_id":  out.EnrollmentID.String(),
		"customer_qr":    out.CustomerQR,
		"tier":           out.Tier,
		"points_balance": out.PointsBalance,
		"recent_events":  events,
	})
}

func (s *Server) CustomerGetWalletByQR(c *gin.Context) {
	if s.GetCustomerWalletUC == nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	qr := customerQRFromQuery(c)
	if qr == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_customer_qr"})
		return
	}
	out, err := s.GetCustomerWalletUC.Execute(c.Request.Context(), usecase.GetCustomerWalletInput{CustomerQR: qr})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	s.respondCustomerWallet(c, out)
}

func (s *Server) CustomerGetMyWallet(c *gin.Context) {
	if s.GetCustomerWalletUC == nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	if claims.ActiveEnrollmentID == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_active_enrollment"})
		return
	}
	out, err := s.GetCustomerWalletUC.Execute(c.Request.Context(), usecase.GetCustomerWalletInput{
		EnrollmentID: claims.ActiveEnrollmentID,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	s.respondCustomerWallet(c, out)
}

type customerAuthLoginBody struct {
	PhoneVerifyToken string `json:"phone_verify_token"`
}

func (s *Server) CustomerAuthLogin(c *gin.Context) {
	var body customerAuthLoginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.CustomerLoginUC.Execute(c.Request.Context(), usecase.CustomerLoginInput{
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
	out, err := s.SelectCustomerContextUC.Execute(c.Request.Context(), usecase.SelectCustomerContextInput{
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
