package httpserver

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parseTenantMetricsQuery(c *gin.Context) (ports.TenantMetricsInput, bool) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return ports.TenantMetricsInput{}, false
	}
	period := strings.TrimSpace(c.DefaultQuery("period", "7d"))
	from, to, label, err := periodWindow(period)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_period"})
		return ports.TenantMetricsInput{}, false
	}
	in := ports.TenantMetricsInput{
		TenantID: tenantID,
		From:     from,
		To:       to,
	}
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		locID, err := uuid.Parse(raw)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return ports.TenantMetricsInput{}, false
		}
		in.LocationID = &locID
	}
	_ = label
	return in, true
}

func periodWindow(period string) (from, to time.Time, label string, err error) {
	now := time.Now().UTC()
	to = now
	switch period {
	case "7d", "":
		from = now.AddDate(0, 0, -7)
		label = "7d"
	case "30d":
		from = now.AddDate(0, 0, -30)
		label = "30d"
	default:
		return time.Time{}, time.Time{}, "", errInvalidPeriod
	}
	return from, to, label, nil
}

var errInvalidPeriod = errors.New("invalid period")

func parseNearbyQuery(c *gin.Context) (ports.NearbyLocationsQuery, bool) {
	latStr := strings.TrimSpace(c.Query("lat"))
	lngStr := strings.TrimSpace(c.Query("lng"))
	country := strings.ToUpper(strings.TrimSpace(c.Query("country_code")))
	city := strings.TrimSpace(c.Query("city"))

	q := ports.NearbyLocationsQuery{
		CountryCode: country,
		City:        city,
		RadiusKm:    25,
		Limit:       20,
	}
	if v := strings.TrimSpace(c.Query("radius_km")); v != "" {
		f, err := strconv.ParseFloat(v, 64)
		if err != nil || f <= 0 {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_radius_km"})
			return q, false
		}
		if f > 100 {
			f = 100
		}
		q.RadiusKm = f
	}
	if v := strings.TrimSpace(c.Query("limit")); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n <= 0 {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_limit"})
			return q, false
		}
		if n > 50 {
			n = 50
		}
		q.Limit = n
	}

	hasCoords := latStr != "" || lngStr != ""
	if hasCoords && (latStr == "" || lngStr == "") {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "lat_lng_required_together"})
		return q, false
	}
	if latStr != "" && lngStr != "" {
		lat, err1 := strconv.ParseFloat(latStr, 64)
		lng, err2 := strconv.ParseFloat(lngStr, 64)
		if err1 != nil || err2 != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_coordinates"})
			return q, false
		}
		q.Lat = &lat
		q.Lng = &lng
		return q, true
	}
	if country == "" || city == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "coordinates_or_place_required"})
		return q, false
	}
	if len(country) != 2 {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_country_code"})
		return q, false
	}
	return q, true
}
