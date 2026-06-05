package app

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// RunBootstrapSeed creates the first superadmin when auto-seed is enabled and none exist.
func (a *App) RunBootstrapSeed(ctx context.Context) error {
	if !a.Config.BootstrapAutoSeed {
		return nil
	}
	n, err := a.Users.CountSuperadmins(ctx)
	if err != nil {
		return fmt.Errorf("bootstrap seed: %w", err)
	}
	if n > 0 {
		return nil
	}
	email := strings.TrimSpace(strings.ToLower(a.Config.BootstrapSeedEmail))
	pass := a.Config.BootstrapSeedPassword
	if email == "" || len(pass) < 8 {
		return fmt.Errorf("bootstrap seed: BOOTSTRAP_SUPERADMIN_EMAIL and BOOTSTRAP_SUPERADMIN_PASSWORD are required (min 8 chars)")
	}
	hash, err := a.Hasher.Hash(pass)
	if err != nil {
		return fmt.Errorf("bootstrap seed: %w", err)
	}
	u := &domain.User{
		ID:                 uuid.New(),
		Email:              email,
		PasswordHash:       hash,
		Role:               domain.RoleSuperadmin,
		MustChangePassword: true,
	}
	if err := a.Users.Create(ctx, u); err != nil {
		return fmt.Errorf("bootstrap seed: %w", err)
	}
	log.Printf("bootstrapped superadmin %s (must change password)", email)
	return nil
}
