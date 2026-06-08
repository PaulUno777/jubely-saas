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
  dateRange: {
    sectionTitle: "Période",
    presets: {
      today: "Aujourd'hui",
      last7Days: "7 derniers jours",
      last30Days: "30 derniers jours",
      thisMonth: "Ce mois-ci",
      thisQuarter: "Ce trimestre",
      yearToDate: "Depuis janvier",
    },
    customRange: "Plage personnalisée…",
    customTitle: "Plage de dates personnalisée",
    startLabel: "Date de début",
    endLabel: "Date de fin",
    apply: "Appliquer",
    cancel: "Annuler",
    invalidRange: "La date de fin doit être postérieure ou égale à la date de début.",
    formats: {
      singleDay: "__date__",
      sameMonth: "__start__ – __end__",
      sameYear: "__start__ – __end__",
      crossYear: "__start__ – __end__",
      monthYear: "__date__",
      quarterYear: "__start__ – __end__ __year__",
    },
  },
} as const;

export default common;
