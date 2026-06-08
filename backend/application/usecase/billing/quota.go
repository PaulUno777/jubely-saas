package billing

import (
	"context"
	"fmt"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type QuotaChecker struct {
	Plans         ports.PlanCatalogRepository
	Subscriptions ports.SubscriptionRepository
	Stores        ports.StoreRepository
	StoreMembers  ports.StoreMembershipRepository
	Enrollments   ports.LoyaltyEnrollmentRepository
}

func (q *QuotaChecker) CanCreateStore(ctx context.Context, orgID uuid.UUID) error {
	sub, err := q.Subscriptions.FindByOrganization(ctx, orgID)
	if err != nil {
		return err
	}
	plan, err := q.Plans.FindByCode(ctx, sub.PlanCode)
	if err != nil {
		return err
	}
	n, err := q.Stores.CountByOrganization(ctx, orgID)
	if err != nil {
		return err
	}
	max := plan.MaxStores
	if sub.Status == domain.SubscriptionTrialing {
		max = 1
	}
	if n >= max {
		return fmt.Errorf("%w", domain.ErrQuotaExceeded)
	}
	return nil
}

func (q *QuotaChecker) CanInviteAgent(ctx context.Context, orgID uuid.UUID) error {
	sub, err := q.Subscriptions.FindByOrganization(ctx, orgID)
	if err != nil {
		return err
	}
	plan, err := q.Plans.FindByCode(ctx, sub.PlanCode)
	if err != nil {
		return err
	}
	n, err := q.StoreMembers.CountDistinctAgentsInOrg(ctx, orgID)
	if err != nil {
		return err
	}
	if n >= plan.MaxAgents {
		return fmt.Errorf("%w", domain.ErrQuotaExceeded)
	}
	return nil
}
