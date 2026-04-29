package migrate

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"path"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var files embed.FS

func Up(ctx context.Context, pool *pgxpool.Pool) error {
	entries, err := fs.ReadDir(files, "migrations")
	if err != nil {
		return err
	}
	var names []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		b, err := files.ReadFile(path.Join("migrations", name))
		if err != nil {
			return err
		}
		sql := strings.TrimSpace(string(b))
		if sql == "" {
			continue
		}
		// Execute the full migration file as one script.
		// This supports PL/pgSQL DO blocks and avoids fragile semicolon splitting.
		if _, err := pool.Exec(ctx, sql); err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
	}
	return nil
}
