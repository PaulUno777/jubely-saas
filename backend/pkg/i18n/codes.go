// Package i18n holds stable API error/message keys for clients to translate (en/fr).
package i18n

const (
	CodeBootstrapSuperadminCreated = "bootstrap.superadmin_created"

	CodeValidationInvalid         = "error.validation.invalid"
	CodeAuthUnauthorized          = "error.auth.unauthorized"
	CodeAuthForbidden             = "error.auth.forbidden"
	CodeAuthInvalidCredentials    = "error.auth.invalid_credentials"
	CodeAuthWorkspaceRequired     = "error.auth.workspace_required"
	CodeBootstrapForbidden        = "error.bootstrap.forbidden"
	CodeBootstrapAlreadyCompleted = "error.bootstrap.already_completed"
	CodeTenantSlugTaken           = "error.tenant.slug_taken"
	CodeTenantNotFound            = "error.tenant.not_found"
	CodeInvitationInvalid         = "error.invitation.invalid"
	CodeInvitationExpired         = "error.invitation.expired"
	CodeInvitationAlreadyAccepted = "error.invitation.already_accepted"
	CodeUserEmailTaken            = "error.user.email_taken"
	CodeCustomerPhoneTaken        = "error.customer.phone_taken"
	CodeCustomerEnrollmentActive  = "error.customer.enrollment_active"
	CodeCustomerSelfEnrollmentDisabled = "error.customer.self_enrollment_disabled"
	CodeInternal                  = "error.internal"
	CodeRateLimit                 = "error.rate_limit"
	CodeSubscriptionInactive      = "error.subscription.inactive"
	CodeQuotaExceeded             = "error.quota.exceeded"
)
