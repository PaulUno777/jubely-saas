const admin = {
  root: {
    title: "Portail root admin",
    productionBadge: "Production",
    tenantsCta: "Tenants",
    stats: {
      activeTenants: "Tenants actifs",
      trialTenants: "Tenants en trial",
      trialSub: "Plan starter actif",
      enrolledCustomers: "Clients enrôlés",
      phase3: "Phase 3",
      alerts: "Alertes",
      totalTenants: "Tenants total",
    },
  },
  tenants: {
    title: "Tenants",
    newTenant: "Nouveau tenant",
    listTitle: "Tous les tenants",
    listDescription: "Liste en temps réel (`GET /v1/superadmin/tenants`).",
    tabs: {
      active: "Actifs",
      trial: "Trial",
      all: "Tous",
    },
    table: {
      store: "Enseigne",
      plan: "Plan",
      status: "Statut",
      actions: "Actions",
    },
    loading: "Chargement…",
    loadError: "Échec chargement tenants",
    empty: "Aucun tenant dans ce filtre.",
    view: "Voir",
    suspend: "Suspendre",
    reactivate: "Réactiver",
    statusActive: "Actif",
    statusSuspended: "Suspendu",
    toastUpdated: "Tenant mis à jour",
  },
} as const;

export default admin;
