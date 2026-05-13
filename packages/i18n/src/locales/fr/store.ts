const store = {
  shell: {
    tenantFallback: "Votre enseigne",
    planLabel: "Plan {plan}",
    planUnknown: "Plan —",
    pointsDistributed: "Pts distribués",
    transactionsMonth: "Tx ce mois",
  },
  home: {
    title: "Tableau de bord",
    subtitle: "Vue d'ensemble de votre programme fidélité.",
    searchPlaceholder: "Rechercher client",
    notifications: "Notifications",
    newTransaction: "Nouvelle transaction",
    kpis: {
      activeCustomers: "Clients actifs",
      pointsDistributed: "Points distribués",
      averageBasket: "Panier moyen",
      rewardsClaimed: "Récompenses réclamées",
    },
    panels: {
      pointsChart: "Points gagnés vs dépensés",
      pointsChartHint: "Graphique mensuel — bientôt disponible.",
      tiers: "Répartition des paliers",
      tiersHint: "Bronze, Silver, Gold, Platinum — bientôt disponible.",
    },
  },
  customers: {
    title: "Clients",
    subtitle: "Liste clients et inscriptions — bientôt disponible.",
  },
  transactions: {
    title: "Transactions",
    subtitle: "Historique des points et opérations magasin — bientôt disponible.",
  },
  pointsRules: {
    title: "Règles de points",
    subtitle: "Règles d'attribution et conflits — bientôt disponible.",
  },
  rewards: {
    title: "Récompenses",
    subtitle: "Catalogue et règles d'échange — bientôt disponible.",
  },
  enrollmentQr: {
    title: "QR d'enrôlement",
    subtitle: "Partage du QR d'inscription — bientôt disponible.",
  },
  campaigns: {
    title: "Campagnes",
    subtitle: "Campagnes marketing — bientôt disponible.",
  },
  settings: {
    title: "Paramètres",
    subtitle: "Préférences et marque du magasin — bientôt disponible.",
  },
  branding: {
    title: "Marque",
    subtitle: "Logo et identité visuelle — bientôt disponible.",
  },
  agents: {
    title: "Équipe & agents",
    invite: "Inviter un agent",
    inviteTitle: "Inviter un agent",
    inviteDescription: "Envoie un lien d'activation (token) à l'agent. (UI email plus tard.)",
    email: "Email",
    role: "Rôle",
    createInvitation: "Créer l'invitation",
    tokenLabel: "Token (à partager)",
    usersTitle: "Utilisateurs du magasin",
    usersDescription: "Liste des utilisateurs du tenant (périmètre magasin).",
    loading: "Chargement…",
    loadError: "Échec chargement des utilisateurs",
    empty: "Aucun utilisateur.",
    invalidEmail: "Email invalide",
  },
} as const;

export default store;
