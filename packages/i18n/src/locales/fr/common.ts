const common = {
  form: {
    email: "Adresse email",
    password: "Mot de passe",
    tenant: "Identifiant boutique",
    tenantOptional: "Identifiant boutique (laisser vide pour la connexion superadmin)",
    name: "Nom complet",
    phone: "Téléphone (E.164, ex. +33...)",
    emailOptional: "E-mail (optionnel)",
    submit: "Créer le client",
    creating: "Création…",
    continue: "Continuer",
    back: "Retour",
    copy: "Copier",
    goLogin: "Aller à la connexion",
  },
  nav: {
    staff: {
      createCustomer: "Créer un client",
      qr: "QR client (démo)",
    },
  },
} as const;

export default common;
