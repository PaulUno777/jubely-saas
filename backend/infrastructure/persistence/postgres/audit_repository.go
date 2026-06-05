package postgres

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditRepository struct {
	Pool *pgxpool.Pool
}

func (r *AuditRepository) Append(ctx context.Context, event *domain.AuditEvent) error {
	db := pickDB(ctx, r.Pool)
	metadata := event.MetadataJSON
	if len(metadata) == 0 {
		metadata = []byte("{}")
	}
	const q = `
INSERT INTO audit_events (id, tenant_id, actor_user_id, action, resource_type, resource_id, metadata, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`
	_, err := db.Exec(ctx, q,
		event.ID, event.TenantID, event.ActorUserID, event.Action, event.ResourceType, event.ResourceID, metadata, event.CreatedAt,
	)
	return err
}

func (r *AuditRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.AuditEvent, error) {
	db := pickDB(ctx, r.Pool)
	q := `
SELECT id, tenant_id, actor_user_id, action, resource_type, resource_id, metadata, created_at
FROM audit_events
WHERE tenant_id=$1
ORDER BY created_at DESC`
	args := []any{tenantID}
	if offset > 0 {
		args = append(args, offset)
		q += ` OFFSET $2`
	}
	if limit > 0 {
		if offset > 0 {
			args = append(args, limit)
			q += ` LIMIT $3`
		} else {
			args = append(args, limit)
			q += ` LIMIT $2`
		}
	}
	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.AuditEvent
	for rows.Next() {
		var e domain.AuditEvent
		var metadata []byte
		if err := rows.Scan(&e.ID, &e.TenantID, &e.ActorUserID, &e.Action, &e.ResourceType, &e.ResourceID, &metadata, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.MetadataJSON = metadata
		if len(metadata) == 0 {
			e.MetadataJSON = []byte("{}")
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
