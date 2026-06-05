package httpserver

import (
	"errors"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
)

// MappedError is the HTTP projection of a domain/usecase error.
type MappedError struct {
	HTTPStatus int
	Code       string
	Details    any
}

func mapBootstrapError(err error) MappedError {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		return MappedError{http.StatusForbidden, i18n.CodeBootstrapForbidden, nil}
	case errors.Is(err, domain.ErrConflict):
		return MappedError{http.StatusConflict, i18n.CodeBootstrapAlreadyCompleted, nil}
	case errors.Is(err, domain.ErrInvalid):
		return MappedError{http.StatusBadRequest, i18n.CodeValidationInvalid, map[string]any{"reason": "invalid_input"}}
	default:
		return MappedError{http.StatusInternalServerError, i18n.CodeInternal, nil}
	}
}

func mapLoginError(err error) MappedError {
	switch {
	case errors.Is(err, domain.ErrInvalid):
		return MappedError{http.StatusBadRequest, i18n.CodeValidationInvalid, map[string]any{"reason": "invalid_input"}}
	case errors.Is(err, domain.ErrWorkspaceRequired):
		return MappedError{http.StatusConflict, i18n.CodeAuthWorkspaceRequired, map[string]any{"reason": "workspace_required"}}
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, domain.ErrUnauthorized):
		return MappedError{http.StatusUnauthorized, i18n.CodeAuthInvalidCredentials, nil}
	case errors.Is(err, domain.ErrForbidden):
		return MappedError{http.StatusForbidden, i18n.CodeAuthForbidden, nil}
	default:
		return MappedError{http.StatusInternalServerError, i18n.CodeInternal, nil}
	}
}

func mapTenantError(err error) MappedError {
	switch {
	case errors.Is(err, domain.ErrConflict):
		return MappedError{http.StatusConflict, i18n.CodeTenantSlugTaken, map[string]any{"reason": "slug_taken"}}
	case errors.Is(err, domain.ErrInvalid):
		return MappedError{http.StatusBadRequest, i18n.CodeValidationInvalid, map[string]any{"reason": "invalid_input"}}
	case errors.Is(err, domain.ErrNotFound):
		return MappedError{http.StatusNotFound, i18n.CodeTenantNotFound, map[string]any{"reason": "not_found"}}
	case errors.Is(err, domain.ErrQuotaExceeded):
		return MappedError{http.StatusPaymentRequired, i18n.CodeQuotaExceeded, map[string]any{"reason": "quota_exceeded"}}
	case errors.Is(err, domain.ErrSubscriptionInactive):
		return MappedError{http.StatusPaymentRequired, i18n.CodeSubscriptionInactive, map[string]any{"reason": "subscription_inactive"}}
	case errors.Is(err, domain.ErrForbidden):
		return MappedError{http.StatusForbidden, i18n.CodeAuthForbidden, map[string]any{"reason": "forbidden"}}
	default:
		return MappedError{http.StatusInternalServerError, i18n.CodeInternal, nil}
	}
}

func mapPublicInvitationError(err error) MappedError {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return MappedError{http.StatusBadRequest, i18n.CodeInvitationInvalid, map[string]any{"reason": "not_found"}}
	case errors.Is(err, domain.ErrConflict):
		return MappedError{http.StatusConflict, i18n.CodeInvitationAlreadyAccepted, map[string]any{"reason": "already_accepted"}}
	case errors.Is(err, domain.ErrEmailTaken):
		return MappedError{http.StatusConflict, i18n.CodeUserEmailTaken, map[string]any{"reason": "email_taken"}}
	case errors.Is(err, domain.ErrInvalid):
		return MappedError{http.StatusBadRequest, i18n.CodeValidationInvalid, map[string]any{"reason": "invalid_input"}}
	case errors.Is(err, domain.ErrInvitationExpired):
		return MappedError{http.StatusGone, i18n.CodeInvitationExpired, map[string]any{"reason": "expired"}}
	default:
		return MappedError{http.StatusInternalServerError, i18n.CodeInternal, nil}
	}
}

func mapCustomerError(err error) MappedError {
	switch {
	case errors.Is(err, domain.ErrInvalid):
		return MappedError{http.StatusBadRequest, i18n.CodeValidationInvalid, map[string]any{"reason": "invalid_input"}}
	case errors.Is(err, domain.ErrNotFound):
		return MappedError{http.StatusNotFound, i18n.CodeValidationInvalid, map[string]any{"reason": "not_found"}}
	case errors.Is(err, domain.ErrUnauthorized):
		return MappedError{http.StatusUnauthorized, i18n.CodeAuthInvalidCredentials, map[string]any{"reason": "invalid_otp_or_proof"}}
	case errors.Is(err, domain.ErrPhoneTaken):
		return MappedError{http.StatusConflict, i18n.CodeCustomerPhoneTaken, map[string]any{"reason": "phone_taken"}}
	case errors.Is(err, domain.ErrSelfEnrollmentForbidden):
		return MappedError{http.StatusForbidden, i18n.CodeCustomerSelfEnrollmentDisabled, map[string]any{"reason": "self_enrollment_disabled"}}
	case errors.Is(err, domain.ErrConflict):
		return MappedError{http.StatusConflict, i18n.CodeCustomerEnrollmentActive, map[string]any{"reason": "already_enrolled"}}
	case errors.Is(err, domain.ErrSubscriptionInactive):
		return MappedError{http.StatusPaymentRequired, i18n.CodeSubscriptionInactive, map[string]any{"reason": "subscription_inactive"}}
	case errors.Is(err, domain.ErrForbidden):
		return MappedError{http.StatusForbidden, i18n.CodeAuthForbidden, map[string]any{"reason": "forbidden"}}
	default:
		return MappedError{http.StatusInternalServerError, i18n.CodeInternal, nil}
	}
}
