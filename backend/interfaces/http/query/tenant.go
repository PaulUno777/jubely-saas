package query

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/middleware"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/response"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TenantDateRange struct {
	From       time.Time
	To         time.Time
	Label      string
	LocationID *uuid.UUID
}

func ParseTenantDateRange(c *gin.Context) (TenantDateRange, bool) {
	tenantID, ok := middleware.TenantIDFromScope(c)
	if !ok {
		response.Error(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return TenantDateRange{}, false
	}
	_ = tenantID

	fromRaw := strings.TrimSpace(c.Query("from"))
	toRaw := strings.TrimSpace(c.Query("to"))
	period := strings.TrimSpace(c.Query("period"))

	var from, to time.Time
	var label string
	var err error

	switch {
	case fromRaw != "" && toRaw != "":
		from, err = parseISODate(fromRaw, false)
		if err != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_from"})
			return TenantDateRange{}, false
		}
		to, err = parseISODate(toRaw, true)
		if err != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_to"})
			return TenantDateRange{}, false
		}
		label = "custom"
	case period != "":
		from, to, label, err = periodWindow(period)
		if err != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_period"})
			return TenantDateRange{}, false
		}
	default:
		from, to, label, _ = periodWindow("7d")
	}

	if to.Before(from) {
		response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "to_before_from"})
		return TenantDateRange{}, false
	}

	dr := TenantDateRange{From: from.UTC(), To: to.UTC(), Label: label}
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		locID, err := uuid.Parse(raw)
		if err != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return TenantDateRange{}, false
		}
		dr.LocationID = &locID
	}
	return dr, true
}

func parseISODate(raw string, endOfDay bool) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t.UTC(), nil
	}
	t, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, err
	}
	if endOfDay {
		t = t.Add(24*time.Hour - time.Nanosecond)
	}
	return t.UTC(), nil
}

func ParseTenantMetrics(c *gin.Context) (ports.TenantMetricsInput, bool) {
	dr, ok := ParseTenantDateRange(c)
	if !ok {
		return ports.TenantMetricsInput{}, false
	}
	tenantID, ok := middleware.TenantIDFromScope(c)
	if !ok {
		response.Error(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return ports.TenantMetricsInput{}, false
	}
	return ports.TenantMetricsInput{
		TenantID:   tenantID,
		From:       dr.From,
		To:         dr.To,
		LocationID: dr.LocationID,
	}, true
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
	case "90d":
		from = now.AddDate(0, 0, -90)
		label = "90d"
	case "1y", "year":
		from = now.AddDate(-1, 0, 0)
		label = "1y"
	default:
		return time.Time{}, time.Time{}, "", errInvalidPeriod
	}
	return from, to, label, nil
}

var errInvalidPeriod = errors.New("invalid period")

func ParseNearby(c *gin.Context) (ports.NearbyLocationsQuery, bool) {
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
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_radius_km"})
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
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_limit"})
			return q, false
		}
		if n > 50 {
			n = 50
		}
		q.Limit = n
	}

	hasCoords := latStr != "" || lngStr != ""
	if hasCoords && (latStr == "" || lngStr == "") {
		response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "lat_lng_required_together"})
		return q, false
	}
	if latStr != "" && lngStr != "" {
		lat, err1 := strconv.ParseFloat(latStr, 64)
		lng, err2 := strconv.ParseFloat(lngStr, 64)
		if err1 != nil || err2 != nil {
			response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_coordinates"})
			return q, false
		}
		q.Lat = &lat
		q.Lng = &lng
		return q, true
	}
	if country == "" || city == "" {
		response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "coordinates_or_place_required"})
		return q, false
	}
	if len(country) != 2 {
		response.Error(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_country_code"})
		return q, false
	}
	return q, true
}
