package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

type webAuthnUser struct {
	id          uuid.UUID
	email       string
	credentials []webauthn.Credential
}

func (u webAuthnUser) WebAuthnID() []byte { return []byte(u.id.String()) }
func (u webAuthnUser) WebAuthnName() string {
	return u.email
}
func (u webAuthnUser) WebAuthnDisplayName() string {
	return u.email
}
func (u webAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.credentials
}

func transportsFromStrings(in []string) []protocol.AuthenticatorTransport {
	if len(in) == 0 {
		return nil
	}
	out := make([]protocol.AuthenticatorTransport, 0, len(in))
	for _, s := range in {
		out = append(out, protocol.AuthenticatorTransport(strings.TrimSpace(s)))
	}
	return out
}

func credentialsFromFactors(factors []ports.MFAFactorRow) []webauthn.Credential {
	out := make([]webauthn.Credential, 0, len(factors))
	for _, f := range factors {
		if len(f.CredentialID) == 0 || len(f.PublicKey) == 0 {
			continue
		}
		out = append(out, webauthn.Credential{
			ID:        append([]byte(nil), f.CredentialID...),
			PublicKey: append([]byte(nil), f.PublicKey...),
			Authenticator: webauthn.Authenticator{
				SignCount: uint32(f.SignCount),
			},
			Transport: transportsFromStrings(f.Transports),
		})
	}
	return out
}

type BeginPasskeyRegistration struct {
	WebAuthn     *webauthn.WebAuthn
	Users        ports.UserRepository
	Factors      ports.MFAFactorRepository
	Challenges   ports.WebAuthnChallengeRepository
	Clock        ports.Clock
	ChallengeTTL time.Duration
}

type BeginPasskeyRegistrationInput struct {
	UserID uuid.UUID
}

type BeginPasskeyRegistrationOutput struct {
	ChallengeID uuid.UUID
	Options     *protocol.CredentialCreation
}

func (uc *BeginPasskeyRegistration) Execute(ctx context.Context, in BeginPasskeyRegistrationInput) (*BeginPasskeyRegistrationOutput, error) {
	if in.UserID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	userRow, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, err
	}
	passkeys, err := uc.Factors.ListEnabledPasskeysByUser(ctx, userRow.ID)
	if err != nil {
		return nil, err
	}
	u := webAuthnUser{
		id:          userRow.ID,
		email:       userRow.Email,
		credentials: credentialsFromFactors(passkeys),
	}
	opts, sessionData, err := uc.WebAuthn.BeginRegistration(u)
	if err != nil {
		return nil, err
	}
	b, err := json.Marshal(sessionData)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	now := uc.Clock.Now()
	ttl := uc.ChallengeTTL
	if ttl <= 0 {
		ttl = 5 * time.Minute
	}
	if err := uc.Challenges.Create(ctx, ports.WebAuthnChallenge{
		ID:          id,
		UserID:      userRow.ID,
		Kind:        "registration",
		SessionData: b,
		ExpiresAt:   now.Add(ttl),
		CreatedAt:   now,
	}); err != nil {
		return nil, err
	}
	return &BeginPasskeyRegistrationOutput{ChallengeID: id, Options: opts}, nil
}

type FinishPasskeyRegistration struct {
	WebAuthn   *webauthn.WebAuthn
	Users      ports.UserRepository
	Factors    ports.MFAFactorRepository
	Challenges ports.WebAuthnChallengeRepository
	Clock      ports.Clock
}

type FinishPasskeyRegistrationInput struct {
	UserID      uuid.UUID
	ChallengeID uuid.UUID
	Label       *string
	Request     *http.Request
}

func (uc *FinishPasskeyRegistration) Execute(ctx context.Context, in FinishPasskeyRegistrationInput) error {
	if in.UserID == uuid.Nil || in.ChallengeID == uuid.Nil || in.Request == nil {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	ch, err := uc.Challenges.Find(ctx, in.ChallengeID)
	if err != nil {
		return err
	}
	now := uc.Clock.Now()
	if !now.Before(ch.ExpiresAt) || ch.Kind != "registration" {
		return fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	if ch.UserID != in.UserID {
		return fmt.Errorf("%w", domain.ErrForbidden)
	}
	userRow, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return err
	}
	passkeys, err := uc.Factors.ListEnabledPasskeysByUser(ctx, userRow.ID)
	if err != nil {
		return err
	}
	u := webAuthnUser{
		id:          userRow.ID,
		email:       userRow.Email,
		credentials: credentialsFromFactors(passkeys),
	}
	var sd webauthn.SessionData
	if err := json.Unmarshal(ch.SessionData, &sd); err != nil {
		return err
	}
	cred, err := uc.WebAuthn.FinishRegistration(u, sd, in.Request)
	if err != nil {
		return fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	if err := uc.Factors.CreatePasskey(ctx, ports.CreatePasskeyFactorInput{
		ID:           uuid.New(),
		UserID:       userRow.ID,
		Label:        in.Label,
		CredentialID: cred.ID,
		PublicKey:    cred.PublicKey,
		SignCount:    int64(cred.Authenticator.SignCount),
		Transports:   nil,
		EnabledAt:    now,
		LastUsedAt:   nil,
		CreatedAt:    now,
	}); err != nil {
		return err
	}
	_ = uc.Challenges.Delete(ctx, in.ChallengeID)
	return nil
}

type BeginPasskeyAuthentication struct {
	WebAuthn     *webauthn.WebAuthn
	Users        ports.UserRepository
	Factors      ports.MFAFactorRepository
	Challenges   ports.WebAuthnChallengeRepository
	Clock        ports.Clock
	ChallengeTTL time.Duration
}

type BeginPasskeyAuthenticationInput struct {
	UserID uuid.UUID
}

type BeginPasskeyAuthenticationOutput struct {
	ChallengeID uuid.UUID
	Options     *protocol.CredentialAssertion
}

func (uc *BeginPasskeyAuthentication) Execute(ctx context.Context, in BeginPasskeyAuthenticationInput) (*BeginPasskeyAuthenticationOutput, error) {
	if in.UserID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	userRow, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, err
	}
	passkeys, err := uc.Factors.ListEnabledPasskeysByUser(ctx, userRow.ID)
	if err != nil {
		return nil, err
	}
	u := webAuthnUser{
		id:          userRow.ID,
		email:       userRow.Email,
		credentials: credentialsFromFactors(passkeys),
	}
	opts, sessionData, err := uc.WebAuthn.BeginLogin(u)
	if err != nil {
		return nil, err
	}
	b, err := json.Marshal(sessionData)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	now := uc.Clock.Now()
	ttl := uc.ChallengeTTL
	if ttl <= 0 {
		ttl = 5 * time.Minute
	}
	if err := uc.Challenges.Create(ctx, ports.WebAuthnChallenge{
		ID:          id,
		UserID:      userRow.ID,
		Kind:        "authentication",
		SessionData: b,
		ExpiresAt:   now.Add(ttl),
		CreatedAt:   now,
	}); err != nil {
		return nil, err
	}
	return &BeginPasskeyAuthenticationOutput{ChallengeID: id, Options: opts}, nil
}

type FinishPasskeyAuthentication struct {
	WebAuthn   *webauthn.WebAuthn
	Users      ports.UserRepository
	Factors    ports.MFAFactorRepository
	Challenges ports.WebAuthnChallengeRepository
	Clock      ports.Clock
}

type FinishPasskeyAuthenticationInput struct {
	UserID      uuid.UUID
	ChallengeID uuid.UUID
	Request     *http.Request
}

type FinishPasskeyAuthenticationOutput struct {
	UserID uuid.UUID
}

func (uc *FinishPasskeyAuthentication) Execute(ctx context.Context, in FinishPasskeyAuthenticationInput) (*FinishPasskeyAuthenticationOutput, error) {
	if in.UserID == uuid.Nil || in.ChallengeID == uuid.Nil || in.Request == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	ch, err := uc.Challenges.Find(ctx, in.ChallengeID)
	if err != nil {
		return nil, err
	}
	now := uc.Clock.Now()
	if !now.Before(ch.ExpiresAt) || ch.Kind != "authentication" {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	if ch.UserID != in.UserID {
		return nil, fmt.Errorf("%w", domain.ErrForbidden)
	}
	userRow, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, err
	}
	passkeys, err := uc.Factors.ListEnabledPasskeysByUser(ctx, userRow.ID)
	if err != nil {
		return nil, err
	}
	u := webAuthnUser{
		id:          userRow.ID,
		email:       userRow.Email,
		credentials: credentialsFromFactors(passkeys),
	}
	var sd webauthn.SessionData
	if err := json.Unmarshal(ch.SessionData, &sd); err != nil {
		return nil, err
	}
	cred, err := uc.WebAuthn.FinishLogin(u, sd, in.Request)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	// best-effort update of sign count / last used
	if factor, err := uc.Factors.FindEnabledPasskeyByCredentialID(ctx, cred.ID); err == nil {
		_ = uc.Factors.TouchPasskey(ctx, factor.ID, int64(cred.Authenticator.SignCount), now)
	}
	_ = uc.Challenges.Delete(ctx, in.ChallengeID)
	return &FinishPasskeyAuthenticationOutput{UserID: userRow.ID}, nil
}
