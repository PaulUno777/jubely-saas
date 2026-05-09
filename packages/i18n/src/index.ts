export type Locale = "en" | "fr";

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "app.title": "Jubely",
    "app.login": "Sign in",
    "app.logout": "Sign out",
    "app.backHome": "Home",
    "nav.staff.createCustomer": "Create customer",
    "nav.staff.qr": "Client QR (demo)",
    "form.email": "Email",
    "form.password": "Password",
    "form.tenant": "Tenant slug",
    "form.tenantOptional": "Tenant slug (leave empty for superadmin login)",
    "form.name": "Full name",
    "form.phone": "Phone (E.164, e.g. +33... )",
    "form.emailOptional": "Email (optional)",
    "form.submit": "Create customer",
    "form.creating": "Creating…",
    "form.error.required": "This field is required",
    "form.error.invalid_email": "Invalid email",
    "login.hint": "You need a staff or merchant admin account. Tenant slug must match the tenant you are invited to.",
    "createCustomer.title": "Create a customer (staff)",
    "createCustomer.subtitle": "This enrolls a customer in your current tenant and returns a QR code token to share.",
    "createCustomer.qr": "Customer QR (token)",
    "createCustomer.copy": "Copy",
    "createCustomer.goLogin": "Go to login",
    "createCustomer.success": "Customer created",
    "client.enroll.title": "Enroll in a store",
    "client.enroll.hint": "Scan the store QR (or paste its token), then enter your details to enroll.",
    "client.enroll.storeQrLabel": "Store QR (token)",
    "client.enroll.submit": "Enroll",
    "client.qr.title": "Your QR",
    "client.qr.placeholder": "Log in to see your enrollment QR. This screen will be wired in Phase 2+.",
    "client.qr.tokenLabel": "Customer QR (token)",
    "error.generic": "Something went wrong",
    "error.needsLogin": "You must sign in first.",
    "error.requestFailed": "Request failed",
  },
  fr: {
    "app.title": "Jubely",
    "app.login": "Se connecter",
    "app.logout": "Se déconnecter",
    "app.backHome": "Accueil",
    "nav.staff.createCustomer": "Créer un client",
    "nav.staff.qr": "QR client (démo)",
    "form.email": "E-mail",
    "form.password": "Mot de passe",
    "form.tenant": "Identifiant du locataire",
    "form.tenantOptional": "Identifiant du locataire (laisser vide pour la connexion superadmin)",
    "form.name": "Nom complet",
    "form.phone": "Téléphone (E.164, ex. +33... )",
    "form.emailOptional": "E-mail (optionnel)",
    "form.submit": "Créer le client",
    "form.creating": "Création…",
    "form.error.required": "Ce champ est obligatoire",
    "form.error.invalid_email": "E-mail invalide",
    "login.hint": "Compte requis (staff ou admin marchand). L’identifiant du locataire doit correspondre à votre invitation.",
    "createCustomer.title": "Créer un client (équipe)",
    "createCustomer.subtitle": "Cela inscrit un client sur votre locataire et retourne un token QR à partager.",
    "createCustomer.qr": "QR client (token)",
    "createCustomer.copy": "Copier",
    "createCustomer.goLogin": "Aller à la connexion",
    "createCustomer.success": "Client créé",
    "client.enroll.title": "S’inscrire dans un magasin",
    "client.enroll.hint": "Scannez le QR du magasin (ou collez le token), puis saisissez vos infos pour vous inscrire.",
    "client.enroll.storeQrLabel": "QR magasin (token)",
    "client.enroll.submit": "S’inscrire",
    "client.qr.title": "Votre QR",
    "client.qr.placeholder": "Connectez-vous pour afficher le QR. Écran câblé en Phase 2+.",
    "client.qr.tokenLabel": "QR client (token)",
    "error.generic": "Une erreur est survenue",
    "error.needsLogin": "Vous devez d’abord vous connecter.",
    "error.requestFailed": "Requête échouée",
  },
};

const fallbackLocale: Locale = "en";

function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return fallbackLocale;
  const base = value.split("-")[0]!.toLowerCase();
  if (base === "fr") return "fr";
  if (base === "en") return "en";
  return fallbackLocale;
}

export function detectLocaleFromNavigator(): Locale {
  if (typeof window === "undefined" || !window.navigator?.language) {
    return fallbackLocale;
  }
  return normalizeLocale(window.navigator.language);
}

export function t(locale: Locale, key: string, vars: Record<string, string> = {}): string {
  const fromLocale = messages[locale]?.[key];
  const fromFallback = messages[fallbackLocale]![key];
  let template = fromLocale ?? fromFallback ?? key;
  for (const [k, v] of Object.entries(vars)) {
    template = template.replaceAll(`{${k}}`, v);
  }
  return template;
}
