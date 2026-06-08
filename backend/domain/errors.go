package domain

import "errors"

var (
	ErrNotFound          = errors.New("not_found")
	ErrConflict          = errors.New("conflict")
	ErrInvalid           = errors.New("invalid")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
	ErrWorkspaceRequired = errors.New("workspace_required")
	ErrInvitationExpired = errors.New("invitation_expired")
	ErrEmailTaken        = errors.New("email_taken")
	ErrPhoneTaken        = errors.New("phone_taken")
	ErrSelfEnrollmentForbidden = errors.New("self_enrollment_forbidden")
	ErrQuotaExceeded           = errors.New("quota_exceeded")
	ErrSubscriptionInactive    = errors.New("subscription_inactive")
)
