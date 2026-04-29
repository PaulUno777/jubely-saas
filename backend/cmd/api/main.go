package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/timeutil"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/PaulUno777/jubely-saas/backend/internal/db"
	"github.com/PaulUno777/jubely-saas/backend/internal/migrate"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/httpserver"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	if err := migrate.Up(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	clock := timeutil.SystemClock{}
	hasher := security.BcryptHasher{}

	tenantRepo := &postgres.TenantRepository{Pool: pool}
	userRepo := &postgres.UserRepository{Pool: pool}
	invRepo := &postgres.InvitationRepository{Pool: pool}
	txManager := &postgres.TxManager{Pool: pool}

	signer := &authtoken.JWTSigner{
		Secret: []byte(cfg.JWTSecret),
		TTL:    cfg.JWTAccessTTL,
	}

	bootstrap := &usecase.BootstrapSuperadmin{
		Users:   userRepo,
		Hasher:  hasher,
		Secret:  cfg.BootstrapSecret,
	}
	login := &usecase.Login{
		Tenants: tenantRepo,
		Users:   userRepo,
		Hasher:  hasher,
		Signer:  signer,
	}
	createTenant := &usecase.CreateTenant{
		Tenants: tenantRepo,
		Clock:   clock,
	}
	inviteTTL := 7 * 24 * time.Hour
	createInvitation := &usecase.CreateMerchantInvitation{
		Tenants:     tenantRepo,
		Invitations: invRepo,
		Clock:       clock,
		TokenTTL:    inviteTTL,
		DefaultRole: domain.RoleMerchantAdmin,
	}
	acceptInvitation := &usecase.AcceptMerchantInvitation{
		Tx:          txManager,
		Users:       userRepo,
		Invitations: invRepo,
		Hasher:      hasher,
		Clock:       clock,
	}

	srv := &httpserver.Server{
		BootstrapUC:        bootstrap,
		LoginUC:            login,
		CreateTenantUC:     createTenant,
		CreateInvitationUC: createInvitation,
		AcceptInvitationUC: acceptInvitation,
		Tenants:            tenantRepo,
		Invitations:        invRepo,
	}

	engine := httpserver.NewRouter(signer, srv)

	httpServer := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("listening on %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Println("bye")
}
