package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

type VerifyLoginTOTP struct {
	Users         ports.UserRepository
	Factors       ports.MFAFactorRepository
	RefreshTokens ports.RefreshTokenRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	Signer        ports.TokenSigner
	MFASigner     *authtoken.JWTSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
	Key           []byte
}

type VerifyLoginTOTPInput struct {
	ChallengeToken string
	Code           string
	UserAgent      string
	IP             *string
}

type VerifyLoginTOTPOutput struct {
	Step               string
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	MembershipID       *uuid.UUID
	TenantID           *uuid.UUID
	Role               *domain.Role
	Email              string
	MustChangePassword bool
	Workspaces         []domain.WorkspaceSummary
	CustomerID         *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
}

func (uc *VerifyLoginTOTP) Execute(ctx context.Context, in VerifyLoginTOTPInput) (*VerifyLoginTOTPOutput, error) {
	code := strings.TrimSpace(in.Code)
	ct := strings.TrimSpace(in.ChallengeToken)
	if code == "" || ct == "" || uc.MFASigner == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	challengeClaims, err := uc.MFASigner.ParseMFAChallengeToken(ctx, ct)
	if err != nil {
		return nil, err
	}
	user, err := uc.Users.FindByID(ctx, challengeClaims.UserID)
	if err != nil {
		return nil, err
	}
	factors, err := uc.Factors.ListEnabledTOTPByUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	ok := false
	for _, f := range factors {
		if len(f.SecretEnc) == 0 {
			continue
		}
		plain, err := security.DecryptAESGCM(uc.Key, f.SecretEnc)
		if err != nil {
			continue
		}
		if totp.Validate(code, string(plain)) {
			ok = true
			break
		}
	}
	if !ok {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}

	mfaEnrolled := 0
	if uc.Factors != nil {
		n, err := uc.Factors.CountEnabledByUser(ctx, user.ID)
		if err != nil {
			return nil, err
		}
		mfaEnrolled = int(n)
	}

	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	state.MFAEnrolledCount = mfaEnrolled
	access, refreshPlain, sessionClaims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}, state, nil, nil, nil, false, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	step := "ok"
	if sessionClaims.MembershipID == nil && !user.IsSuperadmin() && len(state.Workspaces) > 1 {
		step = "workspace_selection_required"
	}
	return &VerifyLoginTOTPOutput{
		Step:               step,
		AccessToken:        access,
		RefreshToken:       refreshPlain,
		UserID:             user.ID,
		MembershipID:       sessionClaims.MembershipID,
		TenantID:           sessionClaims.TenantID,
		Role:               sessionClaims.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		Workspaces:         sessionClaims.Workspaces,
		CustomerID:         sessionClaims.CustomerID,
		ActiveEnrollmentID: sessionClaims.ActiveEnrollmentID,
		Enrollments:        sessionClaims.Enrollments,
	}, nil
}

type FinishLoginPasskey struct {
	Users         ports.UserRepository
	Factors       ports.MFAFactorRepository
	RefreshTokens ports.RefreshTokenRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	Signer        ports.TokenSigner
	MFASigner     *authtoken.JWTSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
	PasskeyAuth   *FinishPasskeyAuthentication
}

type FinishLoginPasskeyInput struct {
	ChallengeToken string
	ChallengeID    uuid.UUID
	Request        *http.Request
	UserAgent      string
	IP             *string
}

type FinishLoginPasskeyOutput struct {
	Step               string
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	MembershipID       *uuid.UUID
	TenantID           *uuid.UUID
	Role               *domain.Role
	Email              string
	MustChangePassword bool
	Workspaces         []domain.WorkspaceSummary
	CustomerID         *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
}

func (uc *FinishLoginPasskey) Execute(ctx context.Context, in FinishLoginPasskeyInput) (*FinishLoginPasskeyOutput, error) {
	ct := strings.TrimSpace(in.ChallengeToken)
	if ct == "" || in.ChallengeID == uuid.Nil || in.Request == nil || uc.MFASigner == nil || uc.PasskeyAuth == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	challengeClaims, err := uc.MFASigner.ParseMFAChallengeToken(ctx, ct)
	if err != nil {
		return nil, err
	}
	if _, err := uc.PasskeyAuth.Execute(ctx, FinishPasskeyAuthenticationInput{
		UserID:      challengeClaims.UserID,
		ChallengeID: in.ChallengeID,
		Request:     in.Request,
	}); err != nil {
		return nil, err
	}
	user, err := uc.Users.FindByID(ctx, challengeClaims.UserID)
	if err != nil {
		return nil, err
	}

	mfaEnrolled := 0
	if uc.Factors != nil {
		n, err := uc.Factors.CountEnabledByUser(ctx, user.ID)
		if err != nil {
			return nil, err
		}
		mfaEnrolled = int(n)
	}

	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	state.MFAEnrolledCount = mfaEnrolled
	access, refreshPlain, sessionClaims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}, state, nil, nil, nil, false, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	step := "ok"
	if sessionClaims.MembershipID == nil && !user.IsSuperadmin() && len(state.Workspaces) > 1 {
		step = "workspace_selection_required"
	}
	return &FinishLoginPasskeyOutput{
		Step:               step,
		AccessToken:        access,
		RefreshToken:       refreshPlain,
		UserID:             user.ID,
		MembershipID:       sessionClaims.MembershipID,
		TenantID:           sessionClaims.TenantID,
		Role:               sessionClaims.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		Workspaces:         sessionClaims.Workspaces,
		CustomerID:         sessionClaims.CustomerID,
		ActiveEnrollmentID: sessionClaims.ActiveEnrollmentID,
		Enrollments:        sessionClaims.Enrollments,
	}, nil
}
