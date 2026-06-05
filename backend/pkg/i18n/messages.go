package i18n

// backendMessages maps stable API codes to human-readable strings per locale.
// Clients may still translate from code; backend message is a convenience.
var backendMessages = map[Locale]map[string]string{
	LocaleEN: {
		CodeBootstrapSuperadminCreated: "Superadmin created.",

		CodeValidationInvalid:         "Invalid request.",
		CodeAuthUnauthorized:          "Unauthorized.",
		CodeAuthForbidden:             "Forbidden.",
		CodeAuthInvalidCredentials:    "Invalid email or password.",
		CodeBootstrapForbidden:        "Bootstrap is not allowed.",
		CodeBootstrapAlreadyCompleted: "Bootstrap has already been completed.",
		CodeTenantSlugTaken:           "This tenant slug is already taken.",
		CodeTenantNotFound:            "Tenant not found.",
		CodeInvitationInvalid:         "Invalid invitation.",
		CodeInvitationExpired:         "Invitation expired.",
		CodeInvitationAlreadyAccepted: "Invitation already accepted.",
		CodeUserEmailTaken:            "Email is already in use.",
		CodeCustomerPhoneTaken:        "Phone number is already registered.",
		CodeCustomerEnrollmentActive:  "Customer is already enrolled for this store.",
		CodeInternal:                  "Something went wrong. Please try again.",
		CodeRateLimit:                 "Too many requests. Please try again later.",
	},
	LocaleFR: {
		CodeBootstrapSuperadminCreated: "Superadmin créé.",

		CodeValidationInvalid:         "Requête invalide.",
		CodeAuthUnauthorized:          "Non autorisé.",
		CodeAuthForbidden:             "Accès interdit.",
		CodeAuthInvalidCredentials:    "E-mail ou mot de passe invalide.",
		CodeBootstrapForbidden:        "Bootstrap non autorisé.",
		CodeBootstrapAlreadyCompleted: "Le bootstrap a déjà été effectué.",
		CodeTenantSlugTaken:           "Ce slug de locataire est déjà pris.",
		CodeTenantNotFound:            "Locataire introuvable.",
		CodeInvitationInvalid:         "Invitation invalide.",
		CodeInvitationExpired:         "Invitation expirée.",
		CodeInvitationAlreadyAccepted: "Invitation déjà acceptée.",
		CodeUserEmailTaken:            "Cet e-mail est déjà utilisé.",
		CodeCustomerPhoneTaken:        "Ce numéro est déjà enregistré.",
		CodeCustomerEnrollmentActive:  "Le client est déjà inscrit dans ce magasin.",
		CodeInternal:                  "Une erreur est survenue. Réessayez plus tard.",
		CodeRateLimit:                 "Trop de requêtes. Réessayez plus tard.",
	},
}
