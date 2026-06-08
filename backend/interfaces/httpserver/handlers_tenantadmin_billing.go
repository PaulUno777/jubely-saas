package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantGetSubscription(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.GetOrgSubscriptionUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.Subscription(out.Subscription, out.Plan))
}

func (s *Server) TenantCreateMoMoInvoice(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.CreateMoMoInvoiceUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondCreated(c, gin.H{
		"id":            out.Invoice.ID.String(),
		"pay_reference": out.Invoice.PayReference,
		"amount_fcfa":   out.Invoice.AmountFCFA,
		"currency":      out.Invoice.Currency,
		"expires_at":    out.Invoice.ExpiresAt,
		"instructions":  out.Instructions,
	})
}

type confirmMoMoBody struct {
	PayReference string `json:"pay_reference"`
}

func (s *Server) TenantConfirmMoMoInvoice(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	invoiceID, err := uuid.Parse(strings.TrimSpace(c.Param("invoiceId")))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_invoice_id"})
		return
	}
	var body confirmMoMoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, nil)
		return
	}
	payRef := strings.TrimSpace(body.PayReference)
	if payRef == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_pay_reference"})
		return
	}
	if err := s.ConfirmMoMoInvoiceUC.Execute(c.Request.Context(), payRef); err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	_ = tenantID
	respondOK(c, gin.H{"status": "paid", "invoice_id": invoiceID.String()})
}
