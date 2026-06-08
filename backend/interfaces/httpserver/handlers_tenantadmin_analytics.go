package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/analytics"
	"net/http"
	"strconv"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

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
	out, err := s.TenantAnalyticsOverviewUC.Execute(c.Request.Context(), analytics.TenantAnalyticsOverviewInput{
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
		"period":   presenter.PeriodMeta(dr.From, dr.To, dr.Label),
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
	series, err := s.MemberGrowthUC.Execute(c.Request.Context(), analytics.MemberGrowthInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"series": series, "period": presenter.PeriodMeta(dr.From, dr.To, dr.Label)})
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
	slices, err := s.TierDistributionUC.Execute(c.Request.Context(), analytics.TierDistributionInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"slices": slices, "period": presenter.PeriodMeta(dr.From, dr.To, dr.Label)})
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
	cells, err := s.HourlyHeatmapUC.Execute(c.Request.Context(), analytics.HourlyHeatmapInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"cells": cells, "period": presenter.PeriodMeta(dr.From, dr.To, dr.Label)})
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
	rows, err := s.TopRewardsUC.Execute(c.Request.Context(), analytics.TopRewardsInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID, Limit: limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"rewards": rows, "period": presenter.PeriodMeta(dr.From, dr.To, dr.Label)})
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
	rows, err := s.RetentionCohortsUC.Execute(c.Request.Context(), analytics.RetentionCohortsInput{
		TenantID: tenantID, From: dr.From, To: dr.To, LocationID: dr.LocationID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"cohorts": rows, "period": presenter.PeriodMeta(dr.From, dr.To, dr.Label)})
}
