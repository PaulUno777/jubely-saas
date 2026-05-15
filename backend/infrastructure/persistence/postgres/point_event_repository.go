package postgres

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PointEventRepository struct {
	Pool *pgxpool.Pool
}

// Append inserts a single point event (append-only ledger).
func (r *PointEventRepository) Append(ctx context.Context, tenantID uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage) error {
	db := pickDB(ctx, r.Pool)
	if len(payload) == 0 {
		payload = json.RawMessage(`{}`)
	}
	const q = `
INSERT INTO point_events (id, tenant_id, enrollment_id, event_type, delta, payload, created_at)
VALUES ($1,$2,$3,$4,$5,$6::jsonb, now())`
	_, err := db.Exec(ctx, q, uuid.New(), tenantID, enrollmentID, eventType, delta, []byte(payload))
	return err
}
