package auth

import (
	"context"
	"encoding/json"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type authSessionDependencies struct {
	Signer        ports.TokenSigner
	RefreshTokens ports.RefreshTokenRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	Stores        ports.StoreRepository
	StoreMembers  ports.StoreMembershipRepository
	Subscriptions ports.SubscriptionRepository
	Clock         ports.Clock
	RefreshTTL    time.Duration
}

type authSessionState struct {
	User               *domain.User
	Workspaces         []domain.WorkspaceSummary
	CustomerID         *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
	ActiveMembershipID *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	MFAEnrolledCount   int
}

func parsePermissionBlob(raw json.RawMessage, role domain.Role) []string {
	if len(raw) == 0 {
		return domain.DefaultPermissionsForRole(role)
	}
	var perms []string
	if err := json.Unmarshal(raw, &perms); err != nil || len(perms) == 0 {
		return domain.DefaultPermissionsForRole(role)
	}
	return perms
}

func loadAuthSessionState(
	ctx context.Context,
	user *domain.User,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
) (*authSessionState, error) {
	state := &authSessionState{User: user}
	if memberships != nil {
		workspaces, err := memberships.ListWorkspaceSummariesByUser(ctx, user.ID)
		if err != nil {
			return nil, err
		}
		state.Workspaces = workspaces
	}
	if customers != nil && catalog != nil {
		customer, err := customers.FindByUserID(ctx, user.ID)
		if err != nil && err != domain.ErrNotFound {
			return nil, err
		}
		if customer != nil {
			state.CustomerID = &customer.ID
			enrollments, err := catalog.ListCustomerEnrollments(ctx, customer.ID)
			if err != nil {
				return nil, err
			}
			state.Enrollments = enrollments
		}
	}
	return state, nil
}

func pickActiveWorkspace(workspaces []domain.WorkspaceSummary, preferredMembershipID *uuid.UUID, preferredTenantSlug string) *domain.WorkspaceSummary {
	if preferredMembershipID != nil {
		for i := range workspaces {
			if workspaces[i].MembershipID == *preferredMembershipID {
				return &workspaces[i]
			}
		}
	}
	if preferredTenantSlug != "" {
		for i := range workspaces {
			if workspaces[i].TenantSlug == preferredTenantSlug {
				return &workspaces[i]
			}
		}
	}
	if len(workspaces) == 1 {
		return &workspaces[0]
	}
	return nil
}

func pickActiveEnrollment(enrollments []domain.CustomerEnrollmentSummary, preferredEnrollmentID *uuid.UUID) *domain.CustomerEnrollmentSummary {
	if preferredEnrollmentID != nil {
		for i := range enrollments {
			if enrollments[i].EnrollmentID == *preferredEnrollmentID {
				return &enrollments[i]
			}
		}
	}
	if len(enrollments) > 0 {
		return &enrollments[0]
	}
	return nil
}

func (s *authSessionState) tokenClaims(activeMembershipID, activeEnrollmentID *uuid.UUID, includeCustomerRole bool) ports.TokenClaims {
	var activeRole *domain.Role
	var activeTenantID *uuid.UUID
	var perms []string

	if ws := pickActiveWorkspace(s.Workspaces, activeMembershipID, ""); ws != nil {
		activeMembershipID = &ws.MembershipID
		activeTenantID = &ws.TenantID
		role := ws.Role
		activeRole = &role
		perms = append([]string(nil), ws.Permissions...)
	} else if s.User.IsSuperadmin() {
		role := domain.RoleSuperadmin
		activeRole = &role
		perms = domain.DefaultPermissionsForRole(role)
	} else if includeCustomerRole {
		if ce := pickActiveEnrollment(s.Enrollments, activeEnrollmentID); ce != nil {
			activeEnrollmentID = &ce.EnrollmentID
			role := domain.RoleCustomer
			activeRole = &role
			perms = domain.DefaultPermissionsForRole(role)
		}
	}

	return ports.TokenClaims{
		UserID:             s.User.ID,
		MembershipID:       activeMembershipID,
		TenantID:           activeTenantID,
		Role:               activeRole,
		Email:              s.User.Email,
		MustChangePassword: s.User.MustChangePassword,
		MFAEnrolledCount:   s.MFAEnrolledCount,
		Permissions:        perms,
		Workspaces:         s.Workspaces,
		CustomerID:         s.CustomerID,
		ActiveEnrollmentID: activeEnrollmentID,
		Enrollments:        s.Enrollments,
	}
}

func issueAuthSession(
	ctx context.Context,
	deps authSessionDependencies,
	state *authSessionState,
	activeMembershipID, activeEnrollmentID *uuid.UUID,
	preferredStoreID *uuid.UUID,
	includeCustomerRole bool,
	userAgent string,
	ip *string,
) (access string, refresh string, claims ports.TokenClaims, err error) {
	claims = state.tokenClaims(activeMembershipID, activeEnrollmentID, includeCustomerRole)
	enrichMerchantSessionClaims(ctx, &claims, deps, preferredStoreID)
	access, err = deps.Signer.SignAccessToken(ctx, claims)
	if err != nil {
		return "", "", ports.TokenClaims{}, err
	}
	refreshPlain, refreshHash, err := newRefreshToken()
	if err != nil {
		return "", "", ports.TokenClaims{}, err
	}
	now := deps.Clock.Now()
	activeMembershipHash := claims.MembershipID
	activeEnrollmentHash := claims.ActiveEnrollmentID
	if err := deps.RefreshTokens.Create(ctx, ports.RefreshTokenCreateInput{
		ID:                 uuid.New(),
		UserID:             state.User.ID,
		TokenHash:          refreshHash,
		ActiveMembershipID: activeMembershipHash,
		ActiveEnrollmentID: activeEnrollmentHash,
		UserAgent:          userAgent,
		IP:                 ip,
		ExpiresAt:          now.Add(deps.RefreshTTL),
	}); err != nil {
		return "", "", ports.TokenClaims{}, err
	}
	return access, refreshPlain, claims, nil
}

func makePlaceholderCustomerEmail(customerID uuid.UUID) string {
	return "customer+" + uuid.NewSHA1(uuid.Nil, []byte(customerID.String())).String() + "@jubely.local"
}

func enrichMerchantSessionClaims(ctx context.Context, claims *ports.TokenClaims, deps authSessionDependencies, preferredStoreID *uuid.UUID) {
	if claims.TenantID == nil || claims.Role == nil || deps.Subscriptions == nil {
		return
	}
	claims.SubscriptionStatus = billing.LoadSubscriptionStatus(ctx, deps.Subscriptions, *claims.TenantID, deps.Clock)
	if deps.Stores == nil {
		return
	}
	storeID, err := billing.ResolveActiveStore(ctx, deps.Stores, deps.StoreMembers, *claims.TenantID, claims.UserID, *claims.Role, preferredStoreID)
	if err == nil {
		claims.ActiveStoreID = storeID
	}
}
