package ports

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// PointEventWriter appends rows to the point_events ledger.
type PointEventWriter interface {
	Append(ctx context.Context, tenantID uuid.UUID, storeID *uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage) error
	AppendAt(ctx context.Context, tenantID uuid.UUID, storeID *uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage, occurredAt time.Time) error
}
