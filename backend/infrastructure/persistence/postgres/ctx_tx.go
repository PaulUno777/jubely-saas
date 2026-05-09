package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type txKey struct{}

func withTx(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(ctx, txKey{}, tx)
}

func txFrom(ctx context.Context) (pgx.Tx, bool) {
	t, ok := ctx.Value(txKey{}).(pgx.Tx)
	return t, ok
}

// dbtx is implemented by *pgxpool.Pool and pgx.Tx.
type dbtx interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func pickDB(ctx context.Context, pool *pgxpool.Pool) dbtx {
	if tx, ok := txFrom(ctx); ok {
		return tx
	}
	return pool
}
