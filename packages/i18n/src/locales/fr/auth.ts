const auth = {
  login: {
    hint: "Compte requis (staff ou admin marchand). L’identifiant boutique doit correspondre à votre invitation.",
    accessEyebrow: "ACCÈS",
    title: "Bonjour.",
    subtitle: "Connectez-vous avec votre email et votre mot de passe.",
    tenantSlugLabel: "Identifiant boutique",
    tenantSlugPlaceholder: "chez-mama",
    tenantSlugHelp:
      "Laissez vide pour l’accès superadmin. Indiquez le slug de la boutique pour un admin magasin, un agent ou un client.",
    mfaSteps: {
      identity: "Identité",
      method: "Méthode 2FA",
      verification: "Vérification",
    },
    method: {
      eyebrow: "DEUXIÈME FACTEUR",
      title: "Choisir la méthode",
      subtitle: "Comment souhaitez-vous vérifier votre identité ?",
      totpTitle: "App TOTP",
      totpDescription: "Google Auth, Authy, 1Password",
      passkeyTitle: "Passkey",
      passkeyDescription: "Face ID, Touch ID, clé FIDO2",
    },
    totp: {
      eyebrow: "APP AUTHENTICATOR",
      title: "Code à 6 chiffres",
      subtitle: "Ouvrez Google Authenticator ou Authy et saisissez le code.",
      verify: "Vérifier le code",
    },
    passkey: {
      eyebrow: "PASSKEY",
      title: "Vérification biométrique",
      subtitle: "Utilisez Face ID, Touch ID ou votre clé de sécurité pour vous connecter sans code.",
      authenticate: "Authentifier avec passkey",
    },
  },
} as const;

export default auth;
