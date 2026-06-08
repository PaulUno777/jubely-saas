package migrate

import (
	"context"
	"database/sql"
	"embed"
	"fmt"

	"github.com/pressly/goose/v3"

	_ "github.com/jackc/pgx/v5/stdlib" // register pgx driver for database/sql
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

// Up runs all pending goose migrations against the given Postgres DSN.
func Up(ctx context.Context, databaseURL string) error {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("sql open: %w", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("ping: %w", err)
	}

	goose.SetBaseFS(embedMigrations)
	defer func() { goose.SetBaseFS(nil) }()

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("goose dialect: %w", err)
	}

	// NOTE: goose.UpContext takes variadic options; passing a literal `nil`
	// counts as one option and triggers a nil deref inside goose.
	if err := goose.UpContext(ctx, db, "migrations"); err != nil {
		return fmt.Errorf("goose up: %w", err)
	}
	return nil
}

// Down rolls back the last migration (CLI helper).
func Down(ctx context.Context, databaseURL string) error {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("sql open: %w", err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("ping: %w", err)
	}
	goose.SetBaseFS(embedMigrations)
	defer func() { goose.SetBaseFS(nil) }()
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("goose dialect: %w", err)
	}
	if err := goose.DownContext(ctx, db, "migrations"); err != nil {
		return fmt.Errorf("goose down: %w", err)
	}
	return nil
}

// Status prints migration version (CLI helper).
func Status(ctx context.Context, databaseURL string) error {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("sql open: %w", err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("ping: %w", err)
	}
	goose.SetBaseFS(embedMigrations)
	defer func() { goose.SetBaseFS(nil) }()
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("goose dialect: %w", err)
	}
	return goose.StatusContext(ctx, db, "migrations")
}
