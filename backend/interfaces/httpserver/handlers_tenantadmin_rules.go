package httpserver

import (
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type storeCreateRuleBody struct {
	Rule     rules.Rule `json:"rule"`
	Priority int        `json:"priority"`
	Active   bool       `json:"active"`
}

type storePatchRuleBody struct {
	Rule     *rules.Rule `json:"rule"`
	Active   *bool       `json:"active"`
	Priority *int        `json:"priority"`
}

type simulateRulesBody struct {
	AmountFcfa int64  `json:"amount_fcfa"`
	OccurredAt string `json:"occurred_at"`
	Tier       string `json:"tier"`
	IsNew      bool   `json:"is_new"`
}

func (s *Server) TenantListRules(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	recs, err := s.ListStoreRulesUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(recs))
	for _, rec := range recs {
		items = append(items, presenter.RuleRecord(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
	}
	respondOK(c, gin.H{"rules": items})
}

func (s *Server) TenantCreateRule(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body storeCreateRuleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	rec, err := s.CreateStoreRuleUC.Execute(c.Request.Context(), loyalty.CreateStoreRuleInput{
		TenantID: tenantID,
		Rule:     body.Rule,
		Priority: body.Priority,
		Active:   body.Active,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, presenter.RuleRecord(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
}

func (s *Server) TenantPatchRule(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	ruleID, err := uuid.Parse(c.Param("ruleId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_rule_id"})
		return
	}
	var body storePatchRuleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	rec, err := s.PatchStoreRuleUC.Execute(c.Request.Context(), loyalty.PatchStoreRuleInput{
		TenantID: tenantID,
		RuleID:   ruleID,
		Rule:     body.Rule,
		Active:   body.Active,
		Priority: body.Priority,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, presenter.RuleRecord(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
}

func (s *Server) TenantSimulateRules(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body simulateRulesBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var occurredAt time.Time
	if body.OccurredAt != "" {
		parsed, err := time.Parse(time.RFC3339, body.OccurredAt)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_occurred_at"})
			return
		}
		occurredAt = parsed.UTC()
	}
	out, err := s.SimulateStoreRulesUC.Execute(c.Request.Context(), loyalty.SimulateStoreRulesInput{
		TenantID:   tenantID,
		AmountFcfa: body.AmountFcfa,
		OccurredAt: occurredAt,
		Tier:       body.Tier,
		IsNew:      body.IsNew,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, out)
}

func (s *Server) TenantValidateRules(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.ValidateStoreRulesUC.Execute(c.Request.Context(), loyalty.ValidateStoreRulesInput{TenantID: tenantID})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"conflicts": out.Conflicts})
}
