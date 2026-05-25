package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type pwaEnrollByStoreQRBody struct {
	StoreQR          string  `json:"store_qr"`
	PhoneE164        string  `json:"phone_e164"`
	Name             string  `json:"name"`
	Email            *string `json:"email"`
	PhoneVerifyToken string  `json:"phone_verify_token"`
}

func (s *Server) PWAEnrollByStoreQR(c *gin.Context) {
	var body pwaEnrollByStoreQRBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.EnrollByStoreQRUC.Execute(c.Request.Context(), usecase.EnrollByStoreQRInput{
		StoreQR:          body.StoreQR,
		PhoneE164:        body.PhoneE164,
		Name:             body.Name,
		Email:            body.Email,
		PhoneVerifyToken: body.PhoneVerifyToken,
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

func customerQRFromRequest(c *gin.Context) string {
	if q := strings.TrimSpace(c.Query("customer_qr")); q != "" {
		return q
	}
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	return ""
}

func (s *Server) PWAGetWallet(c *gin.Context) {
	qr := customerQRFromRequest(c)
	if qr == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_customer_qr"})
		return
	}
	if s.GetPWAWalletUC == nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.GetPWAWalletUC.Execute(c.Request.Context(), usecase.GetPWAWalletInput{CustomerQR: qr})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
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
		"tier":           out.Tier,
		"points_balance": out.PointsBalance,
		"recent_events":  events,
	})
}
