package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) PublicListNearbyLocations(c *gin.Context) {
	q, ok := parseNearbyQuery(c)
	if !ok {
		return
	}
	rows, mode, err := s.ListNearbyLocationsUC.Execute(c.Request.Context(), q)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	origin := gin.H{}
	if q.Lat != nil && q.Lng != nil {
		origin["lat"] = *q.Lat
		origin["lng"] = *q.Lng
	} else {
		origin["country_code"] = q.CountryCode
		origin["city"] = q.City
	}
	items := make([]gin.H, 0, len(rows))
	for _, row := range rows {
		item := gin.H{
			"id":           row.ID.String(),
			"tenant_id":    row.TenantID.String(),
			"tenant_name":  row.TenantName,
			"tenant_slug":  row.TenantSlug,
			"name":         row.Name,
			"slug":         row.Slug,
			"city":         row.City,
			"country_code": row.CountryCode,
			"status":       row.Status,
		}
		if row.StateCode != "" {
			item["state_code"] = row.StateCode
		}
		if row.AddressLine != "" {
			item["address_line"] = row.AddressLine
		}
		if row.Lat != nil {
			item["lat"] = *row.Lat
		}
		if row.Lng != nil {
			item["lng"] = *row.Lng
		}
		if row.DistanceKm != nil {
			item["distance_km"] = *row.DistanceKm
		}
		items = append(items, item)
	}
	respondOK(c, gin.H{
		"mode":      mode,
		"origin":    origin,
		"locations": items,
	})
}
