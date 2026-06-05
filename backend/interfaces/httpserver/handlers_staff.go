package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
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
	out, err := s.CreateCustomerUC.Execute(c.Request.Context(), usecase.CreateCustomerByStaffInput{
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
	out, err := s.StaffRecordPurchaseUC.Execute(c.Request.Context(), usecase.StaffRecordPurchaseInput{
		TenantID:    *claims.TenantID,
		StoreID:     claims.ActiveStoreID,
		PhoneE164:   body.PhoneE164,
		CustomerQR:  body.CustomerQR,
		AmountFcfa:  body.AmountFcfa,
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
