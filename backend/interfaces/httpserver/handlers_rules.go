package httpserver

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ruleRecordToGin(id uuid.UUID, active bool, priority int, raw json.RawMessage) gin.H {
	var rule rules.Rule
	_ = json.Unmarshal(raw, &rule)
	return gin.H{
		"id":       id.String(),
		"active":   active,
		"priority": priority,
		"rule":     rule,
	}
}

func (s *Server) StoreListRules(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	recs, err := s.ListStoreRulesUC.Execute(c.Request.Context(), *claims.TenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(recs))
	for _, rec := range recs {
		items = append(items, ruleRecordToGin(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
	}
	respondOK(c, gin.H{"rules": items})
}

type storeCreateRuleBody struct {
	Rule     rules.Rule `json:"rule"`
	Priority int        `json:"priority"`
	Active   bool       `json:"active"`
}

func (s *Server) StoreCreateRule(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body storeCreateRuleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	rec, err := s.CreateStoreRuleUC.Execute(c.Request.Context(), usecase.CreateStoreRuleInput{
		TenantID: *claims.TenantID,
		Rule:     body.Rule,
		Priority: body.Priority,
		Active:   body.Active,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, ruleRecordToGin(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
}

type storePatchRuleBody struct {
	Rule     *rules.Rule `json:"rule"`
	Active   *bool       `json:"active"`
	Priority *int        `json:"priority"`
}

func (s *Server) StorePatchRule(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
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
	rec, err := s.PatchStoreRuleUC.Execute(c.Request.Context(), usecase.PatchStoreRuleInput{
		TenantID: *claims.TenantID,
		RuleID:   ruleID,
		Rule:     body.Rule,
		Active:   body.Active,
		Priority: body.Priority,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, ruleRecordToGin(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
}

type simulateRulesBody struct {
	AmountFcfa int64  `json:"amount_fcfa"`
	OccurredAt string `json:"occurred_at"`
	Tier       string `json:"tier"`
	IsNew      bool   `json:"is_new"`
}

func (s *Server) StoreSimulateRules(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
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
	out, err := s.SimulateStoreRulesUC.Execute(c.Request.Context(), usecase.SimulateStoreRulesInput{
		TenantID:   *claims.TenantID,
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
