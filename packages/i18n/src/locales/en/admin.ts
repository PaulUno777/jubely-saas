const admin = {
  root: {
    title: "Root admin portal",
    productionBadge: "Production",
    tenantsCta: "Tenants",
    stats: {
      activeTenants: "Active tenants",
      trialTenants: "Trialing tenants",
      trialSub: "Active starter plan",
      enrolledCustomers: "Enrolled customers",
      phase3: "Phase 3",
      alerts: "Alerts",
      totalTenants: "Total tenants",
    },
  },
  tenants: {
    title: "Tenants",
    newTenant: "New tenant",
    listTitle: "All tenants",
    listDescription: "Live list (`GET /v1/superadmin/tenants`).",
    tabs: {
      active: "Active",
      trial: "Trial",
      all: "All",
    },
    table: {
      store: "Store",
      plan: "Plan",
      status: "Status",
      actions: "Actions",
    },
    loading: "Loading…",
    loadError: "Failed to load tenants",
    empty: "No tenants in this filter.",
    view: "View",
    suspend: "Suspend",
    reactivate: "Reactivate",
    statusActive: "Active",
    statusSuspended: "Suspended",
    toastUpdated: "Tenant updated",
  },
} as const;

export default admin;
