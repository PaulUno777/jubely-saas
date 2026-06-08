package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/campaign"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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
	campaigns, err := s.ListCampaignsUC.Execute(c.Request.Context(), campaign.ListCampaignsInput{
		TenantID: tenantID,
		Status:   status,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(campaigns))
	for _, cpg := range campaigns {
		items = append(items, presenter.Campaign(cpg))
	}
	respondOK(c, gin.H{"campaigns": items})
}

type tenantCampaignBody struct {
	Name          string           `json:"name"`
	CampaignType  string           `json:"campaign_type"`
	Status        string           `json:"status"`
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
	cpg, err := s.CreateCampaignUC.Execute(c.Request.Context(), campaign.CampaignMutationInput{
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
	respondCreated(c, presenter.Campaign(*cpg))
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
	respondOK(c, presenter.Campaign(*cpg))
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
	status := strings.TrimSpace(body.Status)
	if status == "active" {
		cpg, err := s.LaunchCampaignUC.Execute(c.Request.Context(), tenantID, campaignID)
		if err != nil {
			respondMapped(c, mapCustomerError(err))
			return
		}
		respondOK(c, presenter.Campaign(*cpg))
		return
	}
	if status == "paused" {
		cpg, err := s.PauseCampaignUC.Execute(c.Request.Context(), tenantID, campaignID)
		if err != nil {
			respondMapped(c, mapCustomerError(err))
			return
		}
		respondOK(c, presenter.Campaign(*cpg))
		return
	}
	name := body.Name
	cType := body.CampaignType
	cpg, err := s.UpdateCampaignUC.Execute(c.Request.Context(), campaign.UpdateCampaignInput{
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
	respondOK(c, presenter.Campaign(*cpg))
}
