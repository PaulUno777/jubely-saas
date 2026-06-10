package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/events"
	"github.com/google/wire"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ProvideEventBus(pool *pgxpool.Pool) *events.InMemoryBus {
	bus := events.NewInMemoryBus()
	events.RegisterLoyaltyHandlers(bus, pool)
	return bus
}

var EventBusSet = wire.NewSet(
	ProvideEventBus,
	wire.Bind(new(ports.EventBus), new(*events.InMemoryBus)),
)
