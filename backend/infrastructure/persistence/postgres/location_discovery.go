package postgres

import (
	"context"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LocationDiscoveryRepository lists open locations for customer nearby discovery.
type LocationDiscoveryRepository struct {
	Pool *pgxpool.Pool
}

func (r *LocationDiscoveryRepository) ListNearby(ctx context.Context, q ports.NearbyLocationsQuery) ([]ports.NearbyLocationRow, string, error) {
	if q.Lat != nil && q.Lng != nil {
		return r.listNearbyPrecise(ctx, q)
	}
	return r.listNearbyCoarse(ctx, q)
}

func (r *LocationDiscoveryRepository) listNearbyPrecise(ctx context.Context, q ports.NearbyLocationsQuery) ([]ports.NearbyLocationRow, string, error) {
	db := pickDB(ctx, r.Pool)
	limit := q.Limit
	if limit <= 0 {
		limit = 20
	}
	radius := q.RadiusKm
	if radius <= 0 {
		radius = 25
	}
	const query = `
SELECT
  l.id,
  l.tenant_id,
  t.name,
  t.slug,
  l.name,
  l.slug,
  l.city,
  l.country_code,
  COALESCE(l.state_code, ''),
  l.address_line,
  l.lat,
  l.lng,
  (
    6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians($1)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians($2))
        + sin(radians($1)) * sin(radians(l.lat))
      ))
    )
  ) AS distance_km
FROM locations l
JOIN tenants t ON t.id = l.tenant_id
WHERE l.status = 'open'
  AND l.lat IS NOT NULL AND l.lng IS NOT NULL
  AND t.active = true
  AND (
    6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians($1)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians($2))
        + sin(radians($1)) * sin(radians(l.lat))
      ))
    )
  ) <= $3
ORDER BY distance_km ASC
LIMIT $4`
	rows, err := db.Query(ctx, query, *q.Lat, *q.Lng, radius, limit)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	out, err := scanNearbyRows(rows, true)
	return out, "precise", err
}

func (r *LocationDiscoveryRepository) listNearbyCoarse(ctx context.Context, q ports.NearbyLocationsQuery) ([]ports.NearbyLocationRow, string, error) {
	db := pickDB(ctx, r.Pool)
	limit := q.Limit
	if limit <= 0 {
		limit = 20
	}
	country := strings.ToUpper(strings.TrimSpace(q.CountryCode))
	city := strings.TrimSpace(q.City)
	const query = `
SELECT
  l.id,
  l.tenant_id,
  t.name,
  t.slug,
  l.name,
  l.slug,
  l.city,
  l.country_code,
  COALESCE(l.state_code, ''),
  l.address_line,
  l.lat,
  l.lng,
  NULL::float8 AS distance_km
FROM locations l
JOIN tenants t ON t.id = l.tenant_id
WHERE l.status = 'open'
  AND t.active = true
  AND upper(l.country_code) = $1
  AND lower(trim(l.city)) = lower(trim($2))
ORDER BY l.is_hq DESC, l.name ASC
LIMIT $3`
	rows, err := db.Query(ctx, query, country, city, limit)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	out, err := scanNearbyRows(rows, false)
	return out, "coarse", err
}

type nearbyScanner interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}

func scanNearbyRows(rows nearbyScanner, withDistance bool) ([]ports.NearbyLocationRow, error) {
	var out []ports.NearbyLocationRow
	for rows.Next() {
		var row ports.NearbyLocationRow
		var dist *float64
		if err := rows.Scan(
			&row.ID, &row.TenantID, &row.TenantName, &row.TenantSlug,
			&row.Name, &row.Slug, &row.City, &row.CountryCode, &row.StateCode,
			&row.AddressLine, &row.Lat, &row.Lng, &dist,
		); err != nil {
			return nil, err
		}
		if withDistance && dist != nil {
			row.DistanceKm = dist
		}
		row.Status = "open"
		out = append(out, row)
	}
	return out, rows.Err()
}

var _ ports.LocationDiscoveryRepository = (*LocationDiscoveryRepository)(nil)
