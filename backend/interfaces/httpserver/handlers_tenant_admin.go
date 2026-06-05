package httpserver

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantListCustomers(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListStoreCustomersUC.Execute(c.Request.Context(), usecase.ListStoreCustomersInput{
		TenantID: tenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Customers))
	for _, row := range out.Customers {
		items = append(items, gin.H{
			"enrollment_id":  row.EnrollmentID.String(),
			"customer_id":    row.CustomerID.String(),
			"name":           row.Name,
			"phone":          row.PhoneE164,
			"email":          row.Email,
			"tier":           gin.H{"code": row.Tier},
			"points_balance": row.PointsBalance,
			"enrolled_at":    row.EnrolledAt,
		})
	}
	respondPage(c, gin.H{"customers": items}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
}

func (s *Server) TenantGetCustomer(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	enrollmentID, err := uuid.Parse(c.Param("enrollmentId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_enrollment_id"})
		return
	}
	out, err := s.GetTenantCustomerUC.Execute(c.Request.Context(), usecase.GetTenantCustomerInput{
		TenantID:     tenantID,
		EnrollmentID: enrollmentID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tenantCustomerDetailToJSON(out))
}

type tenantAdjustPointsBody struct {
	Delta      int    `json:"delta"`
	Reason     string `json:"reason"`
	LocationID string `json:"location_id"`
}

func (s *Server) TenantAdjustCustomerPoints(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	enrollmentID, err := uuid.Parse(c.Param("enrollmentId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_enrollment_id"})
		return
	}
	var body tenantAdjustPointsBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	claims, _ := Claims(c)
	var actorID *uuid.UUID
	if claims.UserID != uuid.Nil {
		actorID = &claims.UserID
	}
	out, err := s.AdjustCustomerPointsUC.Execute(c.Request.Context(), usecase.AdjustCustomerPointsInput{
		TenantID:     tenantID,
		EnrollmentID: enrollmentID,
		ActorUserID:  actorID,
		Delta:        body.Delta,
		Reason:       body.Reason,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{
		"enrollment_id":  out.EnrollmentID.String(),
		"delta":          out.Delta,
		"balance_before": out.BalanceBefore,
		"balance_after":  out.BalanceAfter,
	})
}

func (s *Server) TenantListTransactions(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	offset, limit := parsePageQuery(c)
	var eventType *string
	if v := strings.TrimSpace(c.Query("event_type")); v != "" {
		eventType = &v
	}
	out, err := s.ListStorePointEventsUC.Execute(c.Request.Context(), usecase.ListStorePointEventsInput{
		TenantID:  tenantID,
		Offset:    offset,
		Limit:     limit,
		EventType: eventType,
		From:      &dr.From,
		To:        &dr.To,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Events))
	for _, e := range out.Events {
		item := gin.H{
			"event_id":   e.EventID.String(),
			"event_type": e.EventType,
			"delta":      e.Delta,
			"payload":    json.RawMessage(e.Payload),
			"created_at": e.CreatedAt,
		}
		if e.CustomerName != nil {
			item["customer_name"] = *e.CustomerName
		}
		if e.CustomerPhone != nil {
			item["customer_phone"] = *e.CustomerPhone
		}
		items = append(items, item)
	}
	respondPage(c, gin.H{
		"transactions": items,
		"period":         periodMeta(dr),
	}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
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
		items = append(items, ruleRecordToGin(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
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
	rec, err := s.CreateStoreRuleUC.Execute(c.Request.Context(), usecase.CreateStoreRuleInput{
		TenantID: tenantID,
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
	rec, err := s.PatchStoreRuleUC.Execute(c.Request.Context(), usecase.PatchStoreRuleInput{
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
	respondOK(c, ruleRecordToGin(rec.ID, rec.Active, rec.Priority, rec.RuleJSON))
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
	out, err := s.SimulateStoreRulesUC.Execute(c.Request.Context(), usecase.SimulateStoreRulesInput{
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
	out, err := s.ValidateStoreRulesUC.Execute(c.Request.Context(), usecase.ValidateStoreRulesInput{TenantID: tenantID})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{"conflicts": out.Conflicts})
}

func (s *Server) TenantListTiers(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	tiers, err := s.ListTiersUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	if len(tiers) == 0 && s.SeedDefaultTiersUC != nil {
		tiers, err = s.SeedDefaultTiersUC.Execute(c.Request.Context(), tenantID)
		if err != nil {
			respondMapped(c, mapTenantError(err))
			return
		}
	}
	items := make([]gin.H, 0, len(tiers))
	for _, t := range tiers {
		items = append(items, tierToJSON(t))
	}
	respondOK(c, gin.H{"tiers": items})
}

type tenantUpsertTierBody struct {
	ID           *string          `json:"id"`
	Code         string           `json:"code"`
	SortOrder    int              `json:"sort_order"`
	MinPoints    int              `json:"min_points"`
	Color        string           `json:"color"`
	IconKey      *string          `json:"icon_key"`
	AutoUpgrade  bool             `json:"auto_upgrade"`
	BenefitsJSON *json.RawMessage `json:"benefits_json"`
	Active       bool             `json:"active"`
}

func (s *Server) TenantUpsertTier(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantUpsertTierBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var tierID *uuid.UUID
	if body.ID != nil && strings.TrimSpace(*body.ID) != "" {
		id, err := uuid.Parse(strings.TrimSpace(*body.ID))
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tier_id"})
			return
		}
		tierID = &id
	}
	var benefits json.RawMessage
	if body.BenefitsJSON != nil {
		benefits = *body.BenefitsJSON
	}
	tier, err := s.UpsertTierUC.Execute(c.Request.Context(), usecase.UpsertTierInput{
		TenantID:     tenantID,
		ID:           tierID,
		Code:         body.Code,
		SortOrder:    body.SortOrder,
		MinPoints:    body.MinPoints,
		Color:        body.Color,
		IconKey:      body.IconKey,
		AutoUpgrade:  body.AutoUpgrade,
		BenefitsJSON: benefits,
		Active:       body.Active,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tierToJSON(*tier))
}

func (s *Server) TenantGetQRBranding(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	out, err := s.GetQRBrandingUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, qrBrandingToJSON(out))
}

type tenantPutQRBrandingBody struct {
	Variant        string                       `json:"variant"`
	Theme          string                       `json:"theme"`
	AccentColor    string                       `json:"accent_color"`
	FontFamily     string                       `json:"font_family"`
	HeadingFont    *string                      `json:"heading_font"`
	QRForeground   *string                      `json:"qr_foreground"`
	QRBackground   *string                      `json:"qr_background"`
	LayoutJSON     json.RawMessage              `json:"layout_json"`
	SectionToggles json.RawMessage              `json:"section_toggles"`
	Copy           map[string]map[string]string `json:"copy"`
}

func (s *Server) TenantPutQRBranding(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantPutQRBrandingBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.PutQRBrandingUC.Execute(c.Request.Context(), usecase.PutQRBrandingInput{
		TenantID:       tenantID,
		Variant:        body.Variant,
		Theme:          body.Theme,
		AccentColor:    body.AccentColor,
		FontFamily:     body.FontFamily,
		HeadingFont:    body.HeadingFont,
		QRForeground:   body.QRForeground,
		QRBackground:   body.QRBackground,
		LayoutJSON:     body.LayoutJSON,
		SectionToggles: body.SectionToggles,
		Copy:           body.Copy,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, qrBrandingToJSON(out))
}

func (s *Server) TenantGetStoreQR(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	storeID := uuid.Nil
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return
		}
		storeID = id
	} else if s.Stores != nil {
		if hq, err := s.Stores.FindHQ(c.Request.Context(), tenantID); err == nil {
			storeID = hq.ID
		}
	}
	if storeID == uuid.Nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	token, err := s.QRCodec.SignStoreQR(c.Request.Context(), tenantID, storeID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{"store_qr": token, "location_id": storeID.String()})
}

func (s *Server) TenantGetLocales(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	locales, err := s.GetTenantLocalesUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(locales))
	for _, l := range locales {
		items = append(items, gin.H{
			"locale":     l.Locale,
			"is_primary": l.IsPrimary,
			"enabled":    l.Enabled,
		})
	}
	respondOK(c, gin.H{"locales": items})
}

type tenantPutLocalesBody struct {
	Locales []struct {
		Locale    string `json:"locale"`
		IsPrimary bool   `json:"is_primary"`
		Enabled   bool   `json:"enabled"`
	} `json:"locales"`
}

func (s *Server) TenantPutLocales(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantPutLocalesBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	in := make([]usecase.TenantLocaleInput, 0, len(body.Locales))
	for _, row := range body.Locales {
		in = append(in, usecase.TenantLocaleInput{
			Locale:    row.Locale,
			IsPrimary: row.IsPrimary,
			Enabled:   row.Enabled,
		})
	}
	locales, err := s.PutTenantLocalesUC.Execute(c.Request.Context(), usecase.PutTenantLocalesInput{
		TenantID: tenantID,
		Locales:  in,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(locales))
	for _, l := range locales {
		items = append(items, gin.H{
			"locale":     l.Locale,
			"is_primary": l.IsPrimary,
			"enabled":    l.Enabled,
		})
	}
	respondOK(c, gin.H{"locales": items})
}

func (s *Server) TenantListCampaigns(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var status *string
	if v := strings.TrimSpace(c.Query("status")); v != "" {
		status = &v
	}
	campaigns, err := s.ListCampaignsUC.Execute(c.Request.Context(), usecase.ListCampaignsInput{
		TenantID: tenantID,
		Status:   status,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(campaigns))
	for _, cpg := range campaigns {
		items = append(items, campaignToJSON(cpg))
	}
	respondOK(c, gin.H{"campaigns": items})
}

type tenantCampaignBody struct {
	Name          string           `json:"name"`
	CampaignType  string           `json:"campaign_type"`
	StartsAt      *time.Time       `json:"starts_at"`
	EndsAt        *time.Time       `json:"ends_at"`
	TargetingJSON *json.RawMessage `json:"targeting_json"`
	ActionJSON    *json.RawMessage `json:"action_json"`
	BudgetPoints  *int             `json:"budget_points"`
}

func (s *Server) TenantCreateCampaign(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantCampaignBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	var targeting, action json.RawMessage
	if body.TargetingJSON != nil {
		targeting = *body.TargetingJSON
	}
	if body.ActionJSON != nil {
		action = *body.ActionJSON
	}
	cpg, err := s.CreateCampaignUC.Execute(c.Request.Context(), usecase.CampaignMutationInput{
		TenantID:      tenantID,
		Name:          body.Name,
		CampaignType:  body.CampaignType,
		StartsAt:      body.StartsAt,
		EndsAt:        body.EndsAt,
		TargetingJSON: targeting,
		ActionJSON:    action,
		BudgetPoints:  body.BudgetPoints,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, campaignToJSON(*cpg))
}

func (s *Server) TenantGetCampaign(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_campaign_id"})
		return
	}
	cpg, err := s.GetCampaignUC.Execute(c.Request.Context(), tenantID, campaignID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, campaignToJSON(*cpg))
}

func (s *Server) TenantUpdateCampaign(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_campaign_id"})
		return
	}
	var body tenantCampaignBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	name := body.Name
	cType := body.CampaignType
	cpg, err := s.UpdateCampaignUC.Execute(c.Request.Context(), usecase.UpdateCampaignInput{
		TenantID:      tenantID,
		CampaignID:    campaignID,
		Name:          &name,
		CampaignType:  &cType,
		StartsAt:      body.StartsAt,
		EndsAt:        body.EndsAt,
		TargetingJSON: body.TargetingJSON,
		ActionJSON:    body.ActionJSON,
		BudgetPoints:  body.BudgetPoints,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, campaignToJSON(*cpg))
}

func (s *Server) TenantLaunchCampaign(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_campaign_id"})
		return
	}
	cpg, err := s.LaunchCampaignUC.Execute(c.Request.Context(), tenantID, campaignID)
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, campaignToJSON(*cpg))
}

func (s *Server) TenantPauseCampaign(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_campaign_id"})
		return
	}
	cpg, err := s.PauseCampaignUC.Execute(c.Request.Context(), tenantID, campaignID)
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, campaignToJSON(*cpg))
}

func (s *Server) TenantAnalyticsOverview(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	out, err := s.TenantAnalyticsOverviewUC.Execute(c.Request.Context(), usecase.TenantAnalyticsOverviewInput{
		TenantID:   tenantID,
		From:       dr.From,
		To:         dr.To,
		LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{
		"overview": out,
		"period":   periodMeta(dr),
	})
}

func (s *Server) TenantAnalyticsMemberGrowth(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	series, err := s.MemberGrowthUC.Execute(c.Request.Context(), usecase.MemberGrowthInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"series": series, "period": periodMeta(dr)})
}

func (s *Server) TenantAnalyticsTierDistribution(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	slices, err := s.TierDistributionUC.Execute(c.Request.Context(), usecase.TierDistributionInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"slices": slices, "period": periodMeta(dr)})
}

func (s *Server) TenantAnalyticsHeatmap(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	cells, err := s.HourlyHeatmapUC.Execute(c.Request.Context(), usecase.HourlyHeatmapInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"cells": cells, "period": periodMeta(dr)})
}

func (s *Server) TenantAnalyticsTopRewards(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	limit := 10
	if v := strings.TrimSpace(c.Query("limit")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	rows, err := s.TopRewardsUC.Execute(c.Request.Context(), usecase.TopRewardsInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID, Limit: limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"rewards": rows, "period": periodMeta(dr)})
}

func (s *Server) TenantAnalyticsRetention(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	rows, err := s.RetentionCohortsUC.Execute(c.Request.Context(), usecase.RetentionCohortsInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"cohorts": rows, "period": periodMeta(dr)})
}

func (s *Server) TenantListRewards(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	activeOnly := strings.TrimSpace(c.Query("active_only")) != "false"
	rewards, err := s.ListStoreRewardsUC.Execute(c.Request.Context(), tenantID, activeOnly)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(rewards))
	for _, rw := range rewards {
		items = append(items, rewardToJSON(rw))
	}
	respondOK(c, gin.H{"rewards": items})
}

func (s *Server) TenantListAgents(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantUsersUC.Execute(c.Request.Context(), usecase.ListTenantUsersInput{
		TenantID: tenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Users))
	for _, u := range out.Users {
		items = append(items, userPublicToGin(u))
	}
	respondPage(c, gin.H{"agents": items}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
}

func tenantCustomerDetailToJSON(out *usecase.TenantCustomerDetail) gin.H {
	item := gin.H{
		"enrollment_id": out.Enrollment.ID.String(),
		"customer_id":   out.Customer.ID.String(),
		"name":          out.Customer.Name,
		"phone":         out.Customer.PhoneE164,
		"email":         out.Customer.Email,
		"points_balance": out.PointsBalance,
		"enrollment": gin.H{
			"tier":                   out.Enrollment.Tier,
			"status":                 out.Enrollment.Status,
			"visit_count":            out.Enrollment.VisitCount,
			"lifetime_spend_fcfa":    out.Enrollment.LifetimeSpendFcfa,
			"enrollment_source":      out.Enrollment.EnrollmentSource,
			"enrolled_at":            out.Enrollment.CreatedAt,
			"last_interaction_at":    out.Enrollment.LastInteractionAt,
		},
		"profile": gin.H{
			"gender":            out.Customer.Gender,
			"date_of_birth":     out.Customer.DateOfBirth,
			"neighborhood":      out.Customer.Neighborhood,
			"job_title":         out.Customer.JobTitle,
			"preferred_locale":  out.Customer.PreferredLocale,
			"interests":         out.Customer.Interests,
			"profile_completed_at": out.Customer.ProfileCompletedAt,
		},
	}
	if out.Tier != nil {
		item["tier"] = tierToJSON(*out.Tier)
	}
	return item
}

func tierToJSON(t domain.LoyaltyTier) gin.H {
	return gin.H{
		"id":            t.ID.String(),
		"code":          t.Code,
		"sort_order":    t.SortOrder,
		"min_points":    t.MinPoints,
		"color":         t.Color,
		"icon_key":      t.IconKey,
		"auto_upgrade":  t.AutoUpgrade,
		"benefits_json": json.RawMessage(t.BenefitsJSON),
		"active":        t.Active,
	}
}

func qrBrandingToJSON(out *usecase.GetQRBrandingOutput) gin.H {
	b := out.Branding
	return gin.H{
		"branding": gin.H{
			"variant":         b.Variant,
			"theme":           b.Theme,
			"accent_color":    b.AccentColor,
			"font_family":     b.FontFamily,
			"heading_font":    b.HeadingFont,
			"qr_foreground":   b.QRForeground,
			"qr_background":   b.QRBackground,
			"layout_json":     json.RawMessage(b.LayoutJSON),
			"section_toggles": json.RawMessage(b.SectionToggles),
			"updated_at":      b.UpdatedAt,
		},
		"copy": out.Copy,
	}
}

func campaignToJSON(c domain.Campaign) gin.H {
	return gin.H{
		"id":               c.ID.String(),
		"name":             c.Name,
		"campaign_type":    c.CampaignType,
		"status":           c.Status,
		"starts_at":        c.StartsAt,
		"ends_at":          c.EndsAt,
		"targeting_json":   json.RawMessage(c.TargetingJSON),
		"action_json":      json.RawMessage(c.ActionJSON),
		"budget_points":    c.BudgetPoints,
		"reach_count":      c.ReachCount,
		"conversion_count": c.ConversionCount,
		"created_at":       c.CreatedAt,
		"updated_at":       c.UpdatedAt,
	}
}

func rewardToJSON(rw domain.Reward) gin.H {
	item := gin.H{
		"id":          rw.ID.String(),
		"name":        rw.Name,
		"description": rw.Description,
		"point_cost":  rw.PointCost,
		"min_tier":    rw.MinTier,
		"active":      rw.Active,
		"stock_limit": rw.StockLimit,
		"icon_key":    rw.IconKey,
	}
	if rw.ImageURL != nil {
		item["image_url"] = *rw.ImageURL
	}
	return item
}

func periodMeta(dr tenantDateRange) gin.H {
	return gin.H{
		"from":  dr.From.Format(time.RFC3339),
		"to":    dr.To.Format(time.RFC3339),
		"label": dr.Label,
	}
}

func (s *Server) TenantUploadRewardImage(c *gin.Context) {
	if s.UploadRewardImageUC == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, gin.H{"reason": "upload_not_configured"})
		return
	}
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_reward_id"})
		return
	}
	if err := c.Request.ParseMultipartForm(maxTenantLogoUploadBytes); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_multipart"})
		return
	}
	fh, err := c.FormFile("file")
	if err != nil || fh == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_file"})
		return
	}
	src, err := fh.Open()
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "open_file"})
		return
	}
	defer func() { _ = src.Close() }()
	out, err := s.UploadRewardImageUC.Execute(c.Request.Context(), usecase.UploadRewardImageInput{
		TenantID:    tenantID,
		RewardID:    rewardID,
		Filename:    fh.Filename,
		ContentType: fh.Header.Get("Content-Type"),
		Body:        src,
		Size:        fh.Size,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"image_url": out.ImageURL, "reward": rewardToJSON(*out.Reward)})
}

func (s *Server) TenantRenderQR(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	storeID := uuid.Nil
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return
		}
		storeID = id
	} else if s.Stores != nil {
		if hq, err := s.Stores.FindHQ(c.Request.Context(), tenantID); err == nil {
			storeID = hq.ID
		}
	}
	token, err := s.QRCodec.SignStoreQR(c.Request.Context(), tenantID, storeID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	accent := strings.TrimSpace(c.DefaultQuery("accent", "#C89B3C"))
	size := strings.TrimSpace(c.DefaultQuery("size", "256"))
	svg := `<?xml version="1.0" encoding="UTF-8"?>` +
		`<svg xmlns="http://www.w3.org/2000/svg" width="` + size + `" height="` + size + `" viewBox="0 0 256 256">` +
		`<rect width="256" height="256" fill="white"/>` +
		`<rect x="16" y="16" width="224" height="224" fill="none" stroke="` + accent + `" stroke-width="8"/>` +
		`<text x="128" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="` + accent + `">` + token + `</text>` +
		`</svg>`
	c.Data(http.StatusOK, "image/svg+xml; charset=utf-8", []byte(svg))
}
