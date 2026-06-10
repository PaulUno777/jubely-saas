package events

import (
	"context"
	"errors"

	"github.com/PaulUno777/jubely-saas/backend/application/loyaltyevents"
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterLoyaltyHandlers wires async side effects for loyalty domain events.
func RegisterLoyaltyHandlers(bus *InMemoryBus, pool *pgxpool.Pool) {
	bus.Subscribe(loyaltyevents.EventPointsAwarded, func(ctx context.Context, event ports.DomainEvent) error {
		awarded, ok := event.(loyaltyevents.PointsAwarded)
		if !ok {
			return nil
		}
		return bus.Publish(ctx, loyaltyevents.NotificationRequested{
			TenantID:       awarded.TenantID,
			EnrollmentID:   awarded.EnrollmentID,
			Channel:        "push",
			Template:       "points_awarded",
			IdempotencyKey: "points:" + awarded.EnrollmentID.String() + ":" + event.EventName(),
		})
	})
	bus.Subscribe(loyaltyevents.EventNotificationRequested, func(ctx context.Context, event ports.DomainEvent) error {
		req, ok := event.(loyaltyevents.NotificationRequested)
		if !ok || pool == nil {
			return nil
		}
		const q = `
INSERT INTO notification_deliveries (id, tenant_id, idempotency_key, channel, status)
VALUES ($1, $2, $3, $4, 'pending')
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`
		_, err := pool.Exec(ctx, q, uuid.New(), req.TenantID, req.IdempotencyKey, req.Channel)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		return nil
	})
}
