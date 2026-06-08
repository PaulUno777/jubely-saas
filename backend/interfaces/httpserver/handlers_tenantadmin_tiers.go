package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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
		items = append(items, presenter.Tier(t))
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
	tierCode := strings.TrimSpace(c.Param("tierCode"))
	if tierCode == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tier_code"})
		return
	}
	var body tenantUpsertTierBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	body.Code = tierCode
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
	tier, err := s.UpsertTierUC.Execute(c.Request.Context(), loyalty.UpsertTierInput{
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
	respondOK(c, presenter.Tier(*tier))
}
