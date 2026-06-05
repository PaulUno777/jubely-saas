package app

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/PaulUno777/jubely-saas/backend/internal/jobs"
)

// App is the composition root for the HTTP API process.
type App struct {
	Config config.Config
	Server *http.Server
	Users  ports.UserRepository
	Hasher ports.PasswordHasher
	Jobs   *jobs.Runner
}

// Run starts the HTTP server and blocks until SIGINT/SIGTERM, then shuts down gracefully.
func (a *App) Run() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if a.Jobs != nil {
		a.Jobs.Start(ctx)
	}

	go func() {
		log.Printf("listening on %s", a.Server.Addr)
		if err := a.Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	cancel()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := a.Server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Println("bye")
}
