const navigation = {
  groups: {
    system: "Système",
    operations: "Opérations",
    store: "Magasin",
    account: "Compte",
    team: "Équipe",
    customer: "Client",
    dashboard: "Tableau de bord",
    configuration: "Configuration",
    marketing: "Marketing",
  },
  items: {
    globalOverview: "Vue globale",
    tenants: "Tenants",
    security: "Sécurité (2FA)",
    dashboard: "Tableau de bord",
    overview: "Vue d'ensemble",
    branding: "Marque (logo)",
    agents: "Agents",
    teamAgents: "Équipe & agents",
    home: "Accueil",
    customers: "Clients",
    transactions: "Transactions",
    pointsRules: "Règles de points",
    rewards: "Récompenses",
    enrollmentQr: "QR d'enrôlement",
    campaigns: "Campagnes",
    settings: "Paramètres",
  },
  userMenu: {
    account: "Compte",
    settings: "Paramètres",
    logout: "Déconnexion",
  },
  roles: {
    superadmin: "Superadmin",
    user: "Utilisateur",
  },
} as const;

export default navigation;
