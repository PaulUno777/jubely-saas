package ports

import (
	"context"

	"github.com/google/uuid"
)

type EnrollmentBalanceReader interface {
	EnrollmentPointsBalance(ctx context.Context, enrollmentID uuid.UUID) (int64, error)
}
