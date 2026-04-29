package ports

import "context"

// TxManager runs a function inside a transaction when persistence supports it.
type TxManager interface {
	WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}
