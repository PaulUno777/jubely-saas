package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
)

func ProvideCreateTenant(
	tenants ports.TenantRepository,
	provision *tenant.ProvisionOrganization,
	clock ports.Clock,
) *tenant.CreateTenant {
	return &tenant.CreateTenant{Tenants: tenants, Provision: provision, Clock: clock}
}

func ProvideListTenants(tenants ports.TenantRepository) *tenant.ListTenants {
	return &tenant.ListTenants{Tenants: tenants}
}

func ProvideUpdateTenant(tenants ports.TenantRepository, clock ports.Clock) *tenant.UpdateTenant {
	return &tenant.UpdateTenant{Tenants: tenants, Clock: clock}
}

func ProvideListTenantUsers(
	tenants ports.TenantRepository,
	memberships ports.TenantMembershipRepository,
) *tenant.ListTenantUsers {
	return &tenant.ListTenantUsers{Tenants: tenants, Memberships: memberships}
}

func ProvideCreateMerchantInvitation(
	tenants ports.TenantRepository,
	invitations ports.InvitationRepository,
	clock ports.Clock,
	timing Timing,
) *tenant.CreateMerchantInvitation {
	return &tenant.CreateMerchantInvitation{
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
) *tenant.AcceptMerchantInvitation {
	return &tenant.AcceptMerchantInvitation{
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
) *tenant.CreateTenantUser {
	return &tenant.CreateTenantUser{
		Tenants:     tenants,
		Users:       users,
		Memberships: memberships,
		Hasher:      hasher,
	}
}

func ProvideSuperadminStats(tenants ports.TenantRepository) *tenant.SuperadminStats {
	return &tenant.SuperadminStats{Tenants: tenants}
}

func ProvideStoreSignup(
	tx ports.TxManager,
	tenants ports.TenantRepository,
	provision *tenant.ProvisionOrganization,
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	hasher ports.PasswordHasher,
	signer ports.TokenSigner,
	clock ports.Clock,
) *tenant.StoreSignup {
	return &tenant.StoreSignup{
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
