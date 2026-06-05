package main

import (
	"context"
	"log"

	"github.com/PaulUno777/jubely-saas/backend/internal/app"
)

func main() {
	ctx := context.Background()

	application, cleanup, err := app.Initialize(ctx)
	if err != nil {
		log.Fatalf("app: %v", err)
	}
	defer cleanup()

	if err := application.RunBootstrapSeed(ctx); err != nil {
		log.Fatalf("bootstrap seed: %v", err)
	}

	application.Run()
}
