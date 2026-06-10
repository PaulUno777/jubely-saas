package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PointEventRepository struct {
	Pool *pgxpool.Pool
}

// Append inserts a single point event (append-only ledger).
func (r *PointEventRepository) Append(ctx context.Context, tenantID uuid.UUID, storeID *uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage, ruleIDs []uuid.UUID) error {
	return r.AppendAt(ctx, tenantID, storeID, enrollmentID, eventType, delta, payload, time.Now().UTC(), ruleIDs)
}

// AppendAt inserts a point event with an explicit ledger timestamp.
func (r *PointEventRepository) AppendAt(ctx context.Context, tenantID uuid.UUID, storeID *uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage, occurredAt time.Time, ruleIDs []uuid.UUID) error {
	db := pickDB(ctx, r.Pool)
	if len(payload) == 0 {
		payload = json.RawMessage(`{}`)
	}
	if ruleIDs == nil {
		ruleIDs = []uuid.UUID{}
	}
	const q = `
INSERT INTO point_events (id, tenant_id, location_id, enrollment_id, event_type, delta, payload, rule_ids_applied, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb, $8, $9)`
	_, err := db.Exec(ctx, q, uuid.New(), tenantID, storeID, enrollmentID, eventType, delta, []byte(payload), ruleIDs, occurredAt.UTC())
	return err
}
