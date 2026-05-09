package domain

import "errors"

var (
	ErrNotFound          = errors.New("not_found")
	ErrConflict          = errors.New("conflict")
	ErrInvalid           = errors.New("invalid")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
	ErrInvitationExpired = errors.New("invitation_expired")
	ErrEmailTaken        = errors.New("email_taken")
	ErrPhoneTaken        = errors.New("phone_taken")
)
