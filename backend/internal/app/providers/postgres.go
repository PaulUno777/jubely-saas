package providers

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/PaulUno777/jubely-saas/backend/internal/db"
	"github.com/PaulUno777/jubely-saas/backend/internal/migrate"
	"github.com/google/wire"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresSet wires PostgreSQL adapters and binds them to application ports.
var PostgresSet = wire.NewSet(
	ProvidePool,
	NewTenantRepository,
	NewStoreRepository,
	NewStoreMembershipRepository,
	NewRewardStoreAvailabilityRepository,
	NewPlanCatalogRepository,
	NewSubscriptionRepository,
	NewSubscriptionInvoiceRepository,
	NewStoreLoyaltyMetrics,
	NewStoreCatalog,
	NewUserRepository,
	NewTenantMembershipRepository,
	NewInvitationRepository,
	NewRefreshTokenRepository,
	NewMFAFactorRepository,
	NewWebAuthnChallengeRepository,
	NewTxManager,
	NewCustomerRepository,
	NewEnrollmentRepository,
	NewPointEventRepository,
	NewRewardRepository,
	NewRedemptionRepository,
	NewPointsRuleRepository,
	wire.Bind(new(ports.TenantRepository), new(*postgres.TenantRepository)),
	wire.Bind(new(ports.StoreRepository), new(*postgres.StoreRepository)),
	wire.Bind(new(ports.StoreMembershipRepository), new(*postgres.StoreMembershipRepository)),
	wire.Bind(new(ports.RewardStoreAvailabilityRepository), new(*postgres.RewardStoreAvailabilityRepository)),
	wire.Bind(new(ports.PlanCatalogRepository), new(*postgres.PlanCatalogRepository)),
	wire.Bind(new(ports.SubscriptionRepository), new(*postgres.SubscriptionRepository)),
	wire.Bind(new(ports.UserRepository), new(*postgres.UserRepository)),
	wire.Bind(new(ports.TenantMembershipRepository), new(*postgres.TenantMembershipRepository)),
	wire.Bind(new(ports.InvitationRepository), new(*postgres.InvitationRepository)),
	wire.Bind(new(ports.RefreshTokenRepository), new(*postgres.RefreshTokenRepository)),
	wire.Bind(new(ports.MFAFactorRepository), new(*postgres.MFAFactorRepository)),
	wire.Bind(new(ports.WebAuthnChallengeRepository), new(*postgres.WebAuthnChallengeRepository)),
	wire.Bind(new(ports.TxManager), new(*postgres.TxManager)),
	wire.Bind(new(ports.CustomerIdentityRepository), new(*postgres.CustomerRepository)),
	wire.Bind(new(ports.LoyaltyEnrollmentRepository), new(*postgres.EnrollmentRepository)),
	wire.Bind(new(ports.SubscriptionInvoiceRepository), new(*postgres.SubscriptionInvoiceRepository)),
	wire.Bind(new(ports.PointEventWriter), new(*postgres.PointEventRepository)),
	wire.Bind(new(ports.RewardRepository), new(*postgres.RewardRepository)),
	wire.Bind(new(ports.RedemptionRepository), new(*postgres.RedemptionRepository)),
	wire.Bind(new(ports.PointsRuleRepository), new(*postgres.PointsRuleRepository)),
	wire.Bind(new(ports.TenantLoyaltyMetrics), new(*postgres.StoreLoyaltyMetrics)),
)

// ProvidePool runs migrations, opens the DB pool, and returns a close function for shutdown.
func ProvidePool(ctx context.Context, cfg config.Config) (*pgxpool.Pool, func(), error) {
	if err := migrate.Up(ctx, cfg.DatabaseURL); err != nil {
		return nil, nil, err
	}
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}
	return pool, func() { pool.Close() }, nil
}

func NewTenantRepository(pool *pgxpool.Pool) *postgres.TenantRepository {
	return &postgres.TenantRepository{Pool: pool}
}

func NewStoreRepository(pool *pgxpool.Pool) *postgres.StoreRepository {
	return &postgres.StoreRepository{Pool: pool}
}

func NewStoreMembershipRepository(pool *pgxpool.Pool) *postgres.StoreMembershipRepository {
	return &postgres.StoreMembershipRepository{Pool: pool}
}

func NewRewardStoreAvailabilityRepository(pool *pgxpool.Pool) *postgres.RewardStoreAvailabilityRepository {
	return &postgres.RewardStoreAvailabilityRepository{Pool: pool}
}

func NewPlanCatalogRepository(pool *pgxpool.Pool) *postgres.PlanCatalogRepository {
	return &postgres.PlanCatalogRepository{Pool: pool}
}

func NewSubscriptionRepository(pool *pgxpool.Pool) *postgres.SubscriptionRepository {
	return &postgres.SubscriptionRepository{Pool: pool}
}

func NewSubscriptionInvoiceRepository(pool *pgxpool.Pool) *postgres.SubscriptionInvoiceRepository {
	return &postgres.SubscriptionInvoiceRepository{Pool: pool}
}

func NewStoreLoyaltyMetrics(pool *pgxpool.Pool) *postgres.StoreLoyaltyMetrics {
	return &postgres.StoreLoyaltyMetrics{Pool: pool}
}

func NewStoreCatalog(pool *pgxpool.Pool) *postgres.StoreCatalog {
	return &postgres.StoreCatalog{Pool: pool}
}

func NewUserRepository(pool *pgxpool.Pool) *postgres.UserRepository {
	return &postgres.UserRepository{Pool: pool}
}

func NewTenantMembershipRepository(pool *pgxpool.Pool) *postgres.TenantMembershipRepository {
	return &postgres.TenantMembershipRepository{Pool: pool}
}

func NewInvitationRepository(pool *pgxpool.Pool) *postgres.InvitationRepository {
	return &postgres.InvitationRepository{Pool: pool}
}

func NewRefreshTokenRepository(pool *pgxpool.Pool) *postgres.RefreshTokenRepository {
	return &postgres.RefreshTokenRepository{Pool: pool}
}

func NewMFAFactorRepository(pool *pgxpool.Pool) *postgres.MFAFactorRepository {
	return &postgres.MFAFactorRepository{Pool: pool}
}

func NewWebAuthnChallengeRepository(pool *pgxpool.Pool) *postgres.WebAuthnChallengeRepository {
	return &postgres.WebAuthnChallengeRepository{Pool: pool}
}

func NewTxManager(pool *pgxpool.Pool) *postgres.TxManager {
	return &postgres.TxManager{Pool: pool}
}

func NewCustomerRepository(pool *pgxpool.Pool) *postgres.CustomerRepository {
	return &postgres.CustomerRepository{Pool: pool}
}

func NewEnrollmentRepository(pool *pgxpool.Pool) *postgres.EnrollmentRepository {
	return &postgres.EnrollmentRepository{Pool: pool}
}

func NewPointEventRepository(pool *pgxpool.Pool) *postgres.PointEventRepository {
	return &postgres.PointEventRepository{Pool: pool}
}

func NewRewardRepository(pool *pgxpool.Pool) *postgres.RewardRepository {
	return &postgres.RewardRepository{Pool: pool}
}

func NewRedemptionRepository(pool *pgxpool.Pool) *postgres.RedemptionRepository {
	return &postgres.RedemptionRepository{Pool: pool}
}

func NewPointsRuleRepository(pool *pgxpool.Pool) *postgres.PointsRuleRepository {
	return &postgres.PointsRuleRepository{Pool: pool}
}
