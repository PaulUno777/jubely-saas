package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TxManager struct {
	Pool *pgxpool.Pool
}

func (m *TxManager) WithinTx(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := m.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	ctx = withTx(ctx, tx)
	if err := fn(ctx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
