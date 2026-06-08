package tenant

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
)

var errLocationDiscoveryUnavailable = errors.New("location_discovery_unavailable")

type ListNearbyLocations struct {
	Discovery ports.LocationDiscoveryRepository
}

func (uc *ListNearbyLocations) Execute(ctx context.Context, q ports.NearbyLocationsQuery) ([]ports.NearbyLocationRow, string, error) {
	if uc.Discovery == nil {
		return nil, "", errLocationDiscoveryUnavailable
	}
	return uc.Discovery.ListNearby(ctx, q)
}
