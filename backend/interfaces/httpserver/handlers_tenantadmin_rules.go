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
	Summary  string     `json:"summary"`
}

type storePatchRuleBody struct {
	Rule     *rules.Rule `json:"rule"`
	Active   *bool       `json:"active"`
	Priority *int        `json:"priority"`
	Summary  string      `json:"summary"`
}

type simulateRulesBody struct {
	AmountFcfa      int64        `json:"amount_fcfa"`
	OccurredAt      string       `json:"occurred_at"`
	Tier            string       `json:"tier"`
	IsNew           bool         `json:"is_new"`
	FallbackDefault bool         `json:"fallback_default"`
	DraftRules      []rules.Rule `json:"draft_rules"`
}

type validateRulesBody struct {
	DraftRules []rules.Rule `json:"draft_rules"`
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
		items = append(items, presenter.RuleRecord(rec))
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
		Summary:  body.Summary,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, presenter.RuleRecord(*rec))
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
		Summary:  body.Summary,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, presenter.RuleRecord(*rec))
}

func (s *Server) TenantDeleteRule(c *gin.Context) {
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
	if err := s.DeleteStoreRuleUC.Execute(c.Request.Context(), tenantID, ruleID); err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"deleted": true})
}

func (s *Server) TenantRulesHealth(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.GetRulesHealthUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, out)
}

func (s *Server) TenantListRuleVersions(c *gin.Context) {
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
	vers, err := s.ListRuleVersionsUC.Execute(c.Request.Context(), tenantID, ruleID)
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	items := make([]gin.H, 0, len(vers))
	for _, v := range vers {
		items = append(items, presenter.RuleVersion(v))
	}
	respondOK(c, gin.H{"versions": items})
}

func (s *Server) TenantRestoreRuleVersion(c *gin.Context) {
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
	versionID, err := uuid.Parse(c.Param("versionId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_version_id"})
		return
	}
	rec, err := s.RestoreRuleVersionUC.Execute(c.Request.Context(), loyalty.RestoreRuleVersionInput{
		TenantID: tenantID, RuleID: ruleID, VersionID: versionID,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, presenter.RuleRecord(*rec))
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
		TenantID:        tenantID,
		AmountFcfa:      body.AmountFcfa,
		OccurredAt:      occurredAt,
		Tier:            body.Tier,
		IsNew:           body.IsNew,
		DraftRules:      body.DraftRules,
		FallbackDefault: body.FallbackDefault,
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
	var body validateRulesBody
	_ = c.ShouldBindJSON(&body)
	out, err := s.ValidateStoreRulesUC.Execute(c.Request.Context(), loyalty.ValidateStoreRulesInput{
		TenantID: tenantID, DraftRules: body.DraftRules,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"conflicts": out.Conflicts})
}
