package ports

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
)

// PointEventWriter appends rows to the point_events ledger.
type PointEventWriter interface {
	Append(ctx context.Context, tenantID uuid.UUID, storeID *uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage) error
}
