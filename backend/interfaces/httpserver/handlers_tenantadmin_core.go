package httpserver

import (
	"net/http"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantGetMetrics(c *gin.Context) {
	in, ok := parseTenantMetricsQuery(c)
	if !ok {
		return
	}
	out, err := s.QueryTenantMetricsUC.TenantMetrics(c.Request.Context(), in)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	kpis := make([]gin.H, 0, len(out.KPIs))
	for _, k := range out.KPIs {
		item := gin.H{
			"key":       k.Key,
			"value":     k.Value,
			"delta_pct": k.DeltaPct,
			"trend_up":  k.TrendUp,
			"sparkline": k.Sparkline,
		}
		if k.Unit != "" {
			item["unit"] = k.Unit
		}
		kpis = append(kpis, item)
	}
	respondOK(c, gin.H{
		"period": gin.H{
			"from":  out.Period.From.Format(time.RFC3339),
			"to":    out.Period.To.Format(time.RFC3339),
			"label": out.Period.Label,
		},
		"location_scope": out.LocationScope,
		"kpis":           kpis,
	})
}

func (s *Server) TenantGetLoyaltyActivity(c *gin.Context) {
	in, ok := parseTenantMetricsQuery(c)
	if !ok {
		return
	}
	out, err := s.QueryTenantMetricsUC.LoyaltyActivity(c.Request.Context(), in)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	series := make([]gin.H, 0, len(out.Series))
	for _, pt := range out.Series {
		series = append(series, gin.H{
			"date":               pt.Date.Format("2006-01-02"),
			"label":              pt.Label,
			"points_distributed": pt.PointsDistributed,
			"points_rewarded":    pt.PointsRewarded,
		})
	}
	respondOK(c, gin.H{
		"period": gin.H{
			"from":  out.Period.From.Format(time.RFC3339),
			"to":    out.Period.To.Format(time.RFC3339),
			"label": out.Period.Label,
		},
		"series": series,
	})
}

func (s *Server) TenantGetStats(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	stats, err := s.QueryTenantMetricsUC.NavStats(c.Request.Context(), tenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{
		"customers":      stats.Customers,
		"locations":      stats.Locations,
		"team_members":   stats.TeamMembers,
		"rules_active":   stats.RulesActive,
		"rewards_active": stats.RewardsActive,
		"campaigns":      stats.Campaigns,
	})
}

func (s *Server) TenantListLocations(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	stores, err := s.ListOrgStoresUC.Execute(c.Request.Context(), tenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(stores))
	for _, st := range stores {
		items = append(items, presenter.Location(st))
	}
	respondOK(c, gin.H{"locations": items})
}

type tenantCreateLocationBody struct {
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

func (s *Server) TenantCreateLocation(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantCreateLocationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	st, err := s.CreateOrgStoreUC.Execute(c.Request.Context(), tenant.CreateOrgStoreInput{
		TenantID:    tenantID,
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
	respondCreated(c, presenter.Location(*st))
}

type tenantPatchLocationBody struct {
	IsHQ *bool `json:"is_hq"`
}

func (s *Server) TenantPatchLocation(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	locationID, err := uuid.Parse(c.Param("locationId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
		return
	}
	var body tenantPatchLocationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if body.IsHQ == nil || !*body.IsHQ {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "is_hq_true_required"})
		return
	}
	st, err := s.SetLocationHQUC.Execute(c.Request.Context(), tenant.SetLocationHQInput{
		TenantID:   tenantID,
		LocationID: locationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.Location(*st))
}
