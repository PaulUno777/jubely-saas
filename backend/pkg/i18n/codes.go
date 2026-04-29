// Package i18n holds stable API error/message keys for clients to translate (en/fr).
package i18n

const (
	CodeBootstrapSuperadminCreated = "bootstrap.superadmin_created"

	CodeValidationInvalid          = "error.validation.invalid"
	CodeAuthUnauthorized           = "error.auth.unauthorized"
	CodeAuthForbidden              = "error.auth.forbidden"
	CodeAuthInvalidCredentials     = "error.auth.invalid_credentials"
	CodeBootstrapForbidden         = "error.bootstrap.forbidden"
	CodeBootstrapAlreadyCompleted  = "error.bootstrap.already_completed"
	CodeTenantSlugTaken            = "error.tenant.slug_taken"
	CodeTenantNotFound             = "error.tenant.not_found"
	CodeInvitationInvalid          = "error.invitation.invalid"
	CodeInvitationExpired          = "error.invitation.expired"
	CodeInvitationAlreadyAccepted  = "error.invitation.already_accepted"
	CodeUserEmailTaken             = "error.user.email_taken"
	CodeInternal                   = "error.internal"
)
