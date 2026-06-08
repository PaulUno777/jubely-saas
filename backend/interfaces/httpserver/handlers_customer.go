package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
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
	out, err := s.EnrollByStoreQRUC.Execute(c.Request.Context(), loyalty.EnrollByStoreQRInput{
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

func (s *Server) respondCustomerWallet(c *gin.Context, out *loyalty.GetCustomerWalletOutput) {
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
	out, err := s.GetCustomerWalletUC.Execute(c.Request.Context(), loyalty.GetCustomerWalletInput{CustomerQR: qr})
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
	out, err := s.GetCustomerWalletUC.Execute(c.Request.Context(), loyalty.GetCustomerWalletInput{
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

type customerPatchProfileBody struct {
	Name              *string          `json:"name"`
	Gender            *string          `json:"gender"`
	DateOfBirth       *string          `json:"date_of_birth"`
	Neighborhood      *string          `json:"neighborhood"`
	JobTitle          *string          `json:"job_title"`
	PreferredLocale   *string          `json:"preferred_locale"`
	Interests         *[]string        `json:"interests"`
	NotificationPrefs *json.RawMessage `json:"notification_prefs"`
}

func (s *Server) CustomerPatchProfile(c *gin.Context) {
	if s.UpdateCustomerProfileUC == nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	claims, ok := Claims(c)
	if !ok || claims.CustomerID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body customerPatchProfileBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var dob *time.Time
	if body.DateOfBirth != nil && strings.TrimSpace(*body.DateOfBirth) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*body.DateOfBirth))
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_date_of_birth"})
			return
		}
		dob = &parsed
	}
	out, err := s.UpdateCustomerProfileUC.Execute(c.Request.Context(), loyalty.UpdateCustomerProfileInput{
		CustomerID:        *claims.CustomerID,
		Name:              body.Name,
		Gender:            body.Gender,
		DateOfBirth:       dob,
		Neighborhood:      body.Neighborhood,
		JobTitle:          body.JobTitle,
		PreferredLocale:   body.PreferredLocale,
		Interests:         body.Interests,
		NotificationPrefs: body.NotificationPrefs,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	ci := out.Customer
	respondOK(c, gin.H{
		"customer_id": ci.ID.String(),
		"name":        ci.Name,
		"gender":      ci.Gender,
		"date_of_birth": ci.DateOfBirth,
		"neighborhood": ci.Neighborhood,
		"job_title":   ci.JobTitle,
		"preferred_locale": ci.PreferredLocale,
		"interests":   ci.Interests,
		"profile_completed_at": ci.ProfileCompletedAt,
	})
}
