package analytics

import (
	"fmt"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

func resolveAnalyticsRange(tenantID uuid.UUID, from, to time.Time, locationID *uuid.UUID) (ports.AnalyticsDateRange, error) {
	if tenantID == uuid.Nil || from.IsZero() || to.IsZero() || to.Before(from) {
		return ports.AnalyticsDateRange{}, fmt.Errorf("%w", domain.ErrInvalid)
	}
	return ports.AnalyticsDateRange{
		TenantID:   tenantID,
		From:       from.UTC(),
		To:         to.UTC(),
		LocationID: locationID,
	}, nil
}
