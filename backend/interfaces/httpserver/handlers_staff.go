package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type createCustomerBody struct {
	PhoneE164 string  `json:"phone_e164"`
	Name      string  `json:"name"`
	Email     *string `json:"email"`
}

func (s *Server) StaffCreateCustomer(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}

	var body createCustomerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.CreateCustomerUC.Execute(c.Request.Context(), loyalty.CreateCustomerByStaffInput{
		TenantID:    *claims.TenantID,
		ActorUserID: &claims.UserID,
		PhoneE164:   body.PhoneE164,
		Name:        body.Name,
		Email:       body.Email,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{
		"customer_id":   out.CustomerID.String(),
		"enrollment_id": out.EnrollmentID.String(),
		"customer_qr":   out.CustomerQR,
	})
}

type staffPurchaseBody struct {
	PhoneE164   string `json:"phone_e164"`
	CustomerQR  string `json:"customer_qr"`
	AmountFcfa  int64  `json:"amount_fcfa"`
	OccurredAt  string `json:"occurred_at"`
}

func (s *Server) StaffRecordPurchase(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body staffPurchaseBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if s.StaffRecordPurchaseUC == nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var occurredAt *time.Time
	if body.OccurredAt != "" {
		parsed, err := time.Parse(time.RFC3339, body.OccurredAt)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_occurred_at"})
			return
		}
		parsed = parsed.UTC()
		now := time.Now().UTC()
		if parsed.After(now.Add(5 * time.Minute)) {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "occurred_at_in_future"})
			return
		}
		occurredAt = &parsed
	}
	out, err := s.StaffRecordPurchaseUC.Execute(c.Request.Context(), staff.StaffRecordPurchaseInput{
		TenantID:    *claims.TenantID,
		StoreID:     claims.ActiveStoreID,
		PhoneE164:   body.PhoneE164,
		CustomerQR:  body.CustomerQR,
		AmountFcfa:  body.AmountFcfa,
		OccurredAt:  occurredAt,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{
		"points_awarded":  out.PointsAwarded,
		"delta":           out.Delta,
		"enrollment_id":   out.EnrollmentID.String(),
		"customer_id":     out.CustomerID.String(),
		"customer_name":   out.CustomerName,
		"tier":            out.Tier,
		"balance_before":  out.BalanceBefore,
		"balance_after":   out.BalanceAfter,
	})
}
