package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
)

func ProvideCreateTenant(
	tenants ports.TenantRepository,
	provision *usecase.ProvisionOrganization,
	clock ports.Clock,
) *usecase.CreateTenant {
	return &usecase.CreateTenant{Tenants: tenants, Provision: provision, Clock: clock}
}

func ProvideListTenants(tenants ports.TenantRepository) *usecase.ListTenants {
	return &usecase.ListTenants{Tenants: tenants}
}

func ProvideUpdateTenant(tenants ports.TenantRepository, clock ports.Clock) *usecase.UpdateTenant {
	return &usecase.UpdateTenant{Tenants: tenants, Clock: clock}
}

func ProvideListTenantUsers(
	tenants ports.TenantRepository,
	memberships ports.TenantMembershipRepository,
) *usecase.ListTenantUsers {
	return &usecase.ListTenantUsers{Tenants: tenants, Memberships: memberships}
}

func ProvideCreateMerchantInvitation(
	tenants ports.TenantRepository,
	invitations ports.InvitationRepository,
	clock ports.Clock,
	timing Timing,
) *usecase.CreateMerchantInvitation {
	return &usecase.CreateMerchantInvitation{
		Tenants:     tenants,
		Invitations: invitations,
		Clock:       clock,
		TokenTTL:    timing.InviteTokenTTL,
		DefaultRole: domain.RoleMerchantAdmin,
	}
}

func ProvideAcceptMerchantInvitation(
	tx ports.TxManager,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	invitations ports.InvitationRepository,
	hasher ports.PasswordHasher,
	clock ports.Clock,
) *usecase.AcceptMerchantInvitation {
	return &usecase.AcceptMerchantInvitation{
		Tx:          tx,
		Users:       users,
		Memberships: memberships,
		Customers:   customers,
		Invitations: invitations,
		Hasher:      hasher,
		Clock:       clock,
	}
}

func ProvideCreateTenantUser(
	tenants ports.TenantRepository,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	hasher ports.PasswordHasher,
) *usecase.CreateTenantUser {
	return &usecase.CreateTenantUser{
		Tenants:     tenants,
		Users:       users,
		Memberships: memberships,
		Hasher:      hasher,
	}
}

func ProvideSuperadminStats(tenants ports.TenantRepository) *usecase.SuperadminStats {
	return &usecase.SuperadminStats{Tenants: tenants}
}

func ProvideStoreSignup(
	tx ports.TxManager,
	tenants ports.TenantRepository,
	provision *usecase.ProvisionOrganization,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	hasher ports.PasswordHasher,
	signer ports.TokenSigner,
	clock ports.Clock,
) *usecase.StoreSignup {
	return &usecase.StoreSignup{
		Tx:          tx,
		Tenants:     tenants,
		Provision:   provision,
		Users:       users,
		Memberships: memberships,
		Customers:   customers,
		Hasher:      hasher,
		Signer:      signer,
		Clock:       clock,
	}
}
