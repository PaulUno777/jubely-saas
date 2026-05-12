const navigation = {
  groups: {
    system: "Système",
    operations: "Opérations",
    store: "Magasin",
    account: "Compte",
    team: "Équipe",
    customer: "Client",
  },
  items: {
    globalOverview: "Vue globale",
    tenants: "Tenants",
    security: "Sécurité (2FA)",
    dashboard: "Tableau de bord",
    branding: "Marque (logo)",
    agents: "Agents",
    home: "Accueil",
    customers: "Clients",
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
