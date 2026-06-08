package billing

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// SubscriptionAllowsWrites returns whether mutating loyalty operations are permitted.
func SubscriptionAllowsWrites(sub *domain.Subscription, now time.Time) bool {
	if sub == nil {
		return false
	}
	switch sub.Status {
	case domain.SubscriptionActive:
		return true
	case domain.SubscriptionTrialing:
		if sub.TrialEndsAt != nil && now.After(*sub.TrialEndsAt) {
			return false
		}
		return true
	default:
		return false
	}
}

func LoadSubscriptionStatus(ctx context.Context, subs ports.SubscriptionRepository, orgID uuid.UUID, clock ports.Clock) string {
	sub, err := subs.FindByOrganization(ctx, orgID)
	if err != nil {
		return ""
	}
	now := clock.Now().UTC()
	if sub.Status == domain.SubscriptionTrialing && sub.TrialEndsAt != nil && now.After(*sub.TrialEndsAt) {
		return string(domain.SubscriptionFrozen)
	}
	return string(sub.Status)
}

func ResolveActiveStore(
	ctx context.Context,
	stores ports.StoreRepository,
	storeMemberships ports.StoreMembershipRepository,
	orgID, userID uuid.UUID,
	role domain.Role,
	preferred *uuid.UUID,
) (*uuid.UUID, error) {
	if preferred != nil && *preferred != uuid.Nil {
		if _, err := stores.FindByID(ctx, orgID, *preferred); err != nil {
			return nil, err
		}
		return preferred, nil
	}
	if role == domain.RoleMerchantAdmin {
		hq, err := stores.FindHQ(ctx, orgID)
		if err != nil {
			return nil, err
		}
		return &hq.ID, nil
	}
	ids, err := storeMemberships.ListStoreIDsForUserInOrg(ctx, userID, orgID)
	if err != nil {
		return nil, err
	}
	if len(ids) > 0 {
		id := ids[0]
		return &id, nil
	}
	hq, err := stores.FindHQ(ctx, orgID)
	if err != nil {
		return nil, err
	}
	return &hq.ID, nil
}
