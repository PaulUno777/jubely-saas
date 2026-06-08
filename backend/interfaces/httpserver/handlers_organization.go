package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) orgIDFromClaims(c *gin.Context) (uuid.UUID, bool) {
	tc, ok := Claims(c)
	if !ok || tc.TenantID == nil {
		respondError(c, http.StatusForbidden, i18n.CodeAuthForbidden, nil)
		return uuid.Nil, false
	}
	return *tc.TenantID, true
}

func (s *Server) OrgListStores(c *gin.Context) {
	orgID, ok := s.orgIDFromClaims(c)
	if !ok {
		return
	}
	stores, err := s.ListOrgStoresUC.Execute(c.Request.Context(), orgID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(stores))
	for _, st := range stores {
		items = append(items, locationToJSON(st))
	}
	respondOK(c, gin.H{"stores": items})
}

type createStoreBody struct {
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	CountryCode string   `json:"country_code"`
	StateCode   string   `json:"state_code"`
	City        string   `json:"city"`
	AddressLine string   `json:"address_line"`
	Lat         *float64 `json:"lat"`
	Lng         *float64 `json:"lng"`
	Status      string   `json:"status"`
	Timezone    string   `json:"timezone"`
}

func (s *Server) OrgCreateStore(c *gin.Context) {
	orgID, ok := s.orgIDFromClaims(c)
	if !ok {
		return
	}
	var body createStoreBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, nil)
		return
	}
	st, err := s.CreateOrgStoreUC.Execute(c.Request.Context(), tenant.CreateOrgStoreInput{
		TenantID:    orgID,
		Slug:        body.Slug,
		Name:        body.Name,
		CountryCode: body.CountryCode,
		StateCode:   body.StateCode,
		City:        body.City,
		AddressLine: body.AddressLine,
		Lat:         body.Lat,
		Lng:         body.Lng,
		Status:      domain.StoreStatus(body.Status),
		Timezone:    body.Timezone,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondCreated(c, locationToJSON(*st))
}

func storeToJSON(st domain.Store) gin.H {
	return locationToJSON(st)
}

func (s *Server) OrgGetSubscription(c *gin.Context) {
	orgID, ok := s.orgIDFromClaims(c)
	if !ok {
		return
	}
	out, err := s.GetOrgSubscriptionUC.Execute(c.Request.Context(), orgID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, subscriptionToJSON(out.Subscription, out.Plan))
}

func subscriptionToJSON(sub *domain.Subscription, plan *domain.PlanCatalog) gin.H {
	h := gin.H{
		"plan_code":                sub.PlanCode,
		"status":                   string(sub.Status),
		"billing_period":           sub.BillingPeriod,
		"cancel_at_period_end":     sub.CancelAtPeriodEnd,
		"payment_method_preference": sub.PaymentMethodPref,
	}
	if sub.TrialEndsAt != nil {
		h["trial_ends_at"] = sub.TrialEndsAt
	}
	if sub.CurrentPeriodEnd != nil {
		h["current_period_end"] = sub.CurrentPeriodEnd
	}
	if plan != nil {
		h["plan"] = gin.H{
			"code":                  plan.Code,
			"name":                  plan.Name,
			"max_stores":            plan.MaxStores,
			"max_agents":            plan.MaxAgents,
			"max_active_customers":  plan.MaxActiveCustomers,
			"price_monthly_fcfa":    plan.PriceMonthlyFCFA,
			"price_yearly_fcfa":     plan.PriceYearlyFCFA,
		}
	}
	return h
}

func (s *Server) OrgCreateMoMoInvoice(c *gin.Context) {
	orgID, ok := s.orgIDFromClaims(c)
	if !ok {
		return
	}
	out, err := s.CreateMoMoInvoiceUC.Execute(c.Request.Context(), orgID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondCreated(c, gin.H{
		"id":             out.Invoice.ID.String(),
		"pay_reference":  out.Invoice.PayReference,
		"amount_fcfa":    out.Invoice.AmountFCFA,
		"currency":       out.Invoice.Currency,
		"expires_at":     out.Invoice.ExpiresAt,
		"instructions":   out.Instructions,
	})
}

type confirmMoMoBody struct {
	PayReference string `json:"pay_reference"`
}

func (s *Server) OrgConfirmMoMoInvoice(c *gin.Context) {
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
	_ = invoiceID
	respondOK(c, gin.H{"status": "paid", "invoice_id": invoiceID.String()})
}

func (s *Server) PublicListPlans(c *gin.Context) {
	plans, err := s.ListPlansUC.Execute(c.Request.Context())
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(plans))
	for _, p := range plans {
		items = append(items, gin.H{
			"code":                 p.Code,
			"name":                 p.Name,
			"max_stores":           p.MaxStores,
			"max_agents":           p.MaxAgents,
			"max_active_customers": p.MaxActiveCustomers,
			"price_monthly_fcfa":   p.PriceMonthlyFCFA,
			"price_yearly_fcfa":    p.PriceYearlyFCFA,
		})
	}
	respondOK(c, gin.H{"plans": items})
}
