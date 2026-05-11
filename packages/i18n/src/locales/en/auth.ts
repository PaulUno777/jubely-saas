const auth = {
  login: {
    hint: "You need a staff or merchant admin account. Tenant slug must match the tenant you are invited to.",
    accessEyebrow: "ACCESS",
    title: "Hello.",
    subtitle: "Sign in with your email and password.",
    tenantSlugLabel: "Store identifier",
    tenantSlugPlaceholder: "chez-mama",
    tenantSlugHelp:
      "Leave empty for superadmin access. Enter the store slug for a merchant admin, agent, or customer.",
    mfaSteps: {
      identity: "Identity",
      method: "2FA method",
      verification: "Verification",
    },
    method: {
      eyebrow: "SECOND FACTOR",
      title: "Choose a method",
      subtitle: "How would you like to verify your identity?",
      totpTitle: "TOTP app",
      totpDescription: "Google Authenticator, Authy, 1Password",
      passkeyTitle: "Passkey",
      passkeyDescription: "Face ID, Touch ID, FIDO2 key",
    },
    totp: {
      eyebrow: "AUTHENTICATOR APP",
      title: "6-digit code",
      subtitle: "Open Google Authenticator or Authy and enter the code.",
      verify: "Verify code",
    },
    passkey: {
      eyebrow: "PASSKEY",
      title: "Biometric verification",
      subtitle: "Use Face ID, Touch ID, or your security key to sign in without a code.",
      authenticate: "Authenticate with passkey",
    },
  },
} as const;

export default auth;
