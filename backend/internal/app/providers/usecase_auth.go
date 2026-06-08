package providers

import (
	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/memory"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/go-webauthn/webauthn/webauthn"
)

func ProvideBootstrapSuperadmin(
	users ports.UserRepository,
	hasher ports.PasswordHasher,
	secret string,
) *auth.BootstrapSuperadmin {
	return &auth.BootstrapSuperadmin{Users: users, Hasher: hasher, Secret: secret}
}

func ProvideLogin(
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	hasher ports.PasswordHasher,
	signer ports.TokenSigner,
	refresh ports.RefreshTokenRepository,
	factors ports.MFAFactorRepository,
	clock ports.Clock,
	timing Timing,
	mfaSigner *authtoken.JWTSigner,
) *auth.Login {
	return &auth.Login{
		Users:           users,
		Memberships:     memberships,
		Customers:       customers,
		Catalog:         catalog,
		Hasher:          hasher,
		Signer:          signer,
		RefreshTokens:   refresh,
		Factors:         factors,
		Clock:           clock,
		RefreshTTL:      timing.RefreshTTL,
		MFAChallengeTTL: timing.MFAChallengeTTL,
		MFASigner:       mfaSigner,
	}
}

func ProvideRefreshAuth(
	users ports.UserRepository,
	refresh ports.RefreshTokenRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	factors ports.MFAFactorRepository,
	signer ports.TokenSigner,
	clock ports.Clock,
	timing Timing,
) *auth.RefreshAuth {
	return &auth.RefreshAuth{
		Users:         users,
		RefreshTokens: refresh,
		Memberships:   memberships,
		Customers:     customers,
		Catalog:       catalog,
		Factors:       factors,
		Signer:        signer,
		Clock:         clock,
		TTL:           timing.RefreshTTL,
	}
}

func ProvideLogout(refresh ports.RefreshTokenRepository, clock ports.Clock) *auth.Logout {
	return &auth.Logout{RefreshTokens: refresh, Clock: clock}
}

func ProvideSetupTOTP(factors ports.MFAFactorRepository, clock ports.Clock, key []byte) *auth.SetupTOTP {
	return &auth.SetupTOTP{Factors: factors, Clock: clock, Key: key, Issuer: "Jubely"}
}

func ProvideConfirmTOTP(factors ports.MFAFactorRepository, clock ports.Clock, key []byte) *auth.ConfirmTOTP {
	return &auth.ConfirmTOTP{Factors: factors, Clock: clock, Key: key}
}

func ProvideBeginPasskeyRegistration(
	wa *webauthn.WebAuthn,
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	challenges ports.WebAuthnChallengeRepository,
	clock ports.Clock,
	timing Timing,
) *auth.BeginPasskeyRegistration {
	return &auth.BeginPasskeyRegistration{
		WebAuthn:     wa,
		Users:        users,
		Factors:      factors,
		Challenges:   challenges,
		Clock:        clock,
		ChallengeTTL: timing.PasskeyChallengeTTL,
	}
}

func ProvideFinishPasskeyRegistration(
	wa *webauthn.WebAuthn,
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	challenges ports.WebAuthnChallengeRepository,
	clock ports.Clock,
) *auth.FinishPasskeyRegistration {
	return &auth.FinishPasskeyRegistration{
		WebAuthn:   wa,
		Users:      users,
		Factors:    factors,
		Challenges: challenges,
		Clock:      clock,
	}
}

func ProvideBeginPasskeyAuthentication(
	wa *webauthn.WebAuthn,
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	challenges ports.WebAuthnChallengeRepository,
	clock ports.Clock,
	timing Timing,
) *auth.BeginPasskeyAuthentication {
	return &auth.BeginPasskeyAuthentication{
		WebAuthn:     wa,
		Users:        users,
		Factors:      factors,
		Challenges:   challenges,
		Clock:        clock,
		ChallengeTTL: timing.PasskeyChallengeTTL,
	}
}

func ProvideFinishPasskeyAuthentication(
	wa *webauthn.WebAuthn,
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	challenges ports.WebAuthnChallengeRepository,
	clock ports.Clock,
) *auth.FinishPasskeyAuthentication {
	return &auth.FinishPasskeyAuthentication{
		WebAuthn:   wa,
		Users:      users,
		Factors:    factors,
		Challenges: challenges,
		Clock:      clock,
	}
}

func ProvideVerifyLoginTOTP(
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	refresh ports.RefreshTokenRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	signer ports.TokenSigner,
	mfaSigner *authtoken.JWTSigner,
	clock ports.Clock,
	timing Timing,
	key []byte,
) *auth.VerifyLoginTOTP {
	return &auth.VerifyLoginTOTP{
		Users:         users,
		Factors:       factors,
		RefreshTokens: refresh,
		Memberships:   memberships,
		Customers:     customers,
		Catalog:       catalog,
		Signer:        signer,
		MFASigner:     mfaSigner,
		Clock:         clock,
		RefreshTTL:    timing.RefreshTTL,
		Key:           key,
	}
}

func ProvideFinishLoginPasskey(
	users ports.UserRepository,
	factors ports.MFAFactorRepository,
	refresh ports.RefreshTokenRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	signer ports.TokenSigner,
	mfaSigner *authtoken.JWTSigner,
	clock ports.Clock,
	timing Timing,
	passkeyAuth *auth.FinishPasskeyAuthentication,
) *auth.FinishLoginPasskey {
	return &auth.FinishLoginPasskey{
		Users:         users,
		Factors:       factors,
		RefreshTokens: refresh,
		Memberships:   memberships,
		Customers:     customers,
		Catalog:       catalog,
		Signer:        signer,
		MFASigner:     mfaSigner,
		Clock:         clock,
		RefreshTTL:    timing.RefreshTTL,
		PasskeyAuth:   passkeyAuth,
	}
}

func ProvideChangePassword(users ports.UserRepository, hasher ports.PasswordHasher) *auth.ChangePassword {
	return &auth.ChangePassword{Users: users, Hasher: hasher}
}

func ProvideSelectWorkspace(
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	stores ports.StoreRepository,
	storeMembers ports.StoreMembershipRepository,
	subscriptions ports.SubscriptionRepository,
	refresh ports.RefreshTokenRepository,
	signer ports.TokenSigner,
	clock ports.Clock,
	timing Timing,
) *auth.SelectWorkspace {
	return &auth.SelectWorkspace{
		Users:         users,
		Memberships:   memberships,
		Customers:     customers,
		Catalog:       catalog,
		Stores:        stores,
		StoreMembers:  storeMembers,
		Subscriptions: subscriptions,
		RefreshTokens: refresh,
		Signer:        signer,
		Clock:         clock,
		RefreshTTL:    timing.RefreshTTL,
	}
}

func ProvidePublicCustomerOTP(
	store *memory.PhoneOTPStore,
	signer ports.PhoneEnrollmentProofSigner,
	clock ports.Clock,
) *auth.PublicCustomerOTP {
	return &auth.PublicCustomerOTP{Store: store, ProofSigner: signer, Clock: clock}
}

func ProvideCustomerLogin(
	tx ports.TxManager,
	users ports.UserRepository,
	customers ports.CustomerIdentityRepository,
	memberships ports.TenantMembershipRepository,
	refresh ports.RefreshTokenRepository,
	signer ports.TokenSigner,
	phoneProof ports.PhoneEnrollmentProofParser,
	catalog *postgres.StoreCatalog,
	clock ports.Clock,
	timing Timing,
) *auth.CustomerLogin {
	return &auth.CustomerLogin{
		Tx:               tx,
		Users:            users,
		Customers:        customers,
		Memberships:      memberships,
		RefreshTokens:    refresh,
		Signer:           signer,
		PhoneProofParser: phoneProof,
		Catalog:          catalog,
		Clock:            clock,
		RefreshTTL:       timing.RefreshTTL,
	}
}

func ProvideSelectCustomerContext(
	users ports.UserRepository,
	memberships ports.TenantMembershipRepository,
	customers ports.CustomerIdentityRepository,
	catalog *postgres.StoreCatalog,
	refresh ports.RefreshTokenRepository,
	signer ports.TokenSigner,
	clock ports.Clock,
	timing Timing,
) *auth.SelectCustomerContext {
	return &auth.SelectCustomerContext{
		Users:         users,
		Memberships:   memberships,
		Customers:     customers,
		Catalog:       catalog,
		RefreshTokens: refresh,
		Signer:        signer,
		Clock:         clock,
		RefreshTTL:    timing.RefreshTTL,
	}
}
