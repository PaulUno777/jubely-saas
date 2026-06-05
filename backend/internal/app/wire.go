//go:build wireinject

package app

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/internal/app/providers"
	"github.com/google/wire"
)

// Initialize builds the application graph (generated implementation in wire_gen.go).
func Initialize(ctx context.Context) (*App, func(), error) {
	wire.Build(
		providers.AllSet,
		wire.Struct(new(App), "Config", "Server", "Users", "Hasher"),
	)
	return nil, nil, nil
}
