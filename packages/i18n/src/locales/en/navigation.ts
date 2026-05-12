const navigation = {
  groups: {
    system: "System",
    operations: "Operations",
    store: "Store",
    account: "Account",
    team: "Team",
    customer: "Customer",
  },
  items: {
    globalOverview: "Overview",
    tenants: "Tenants",
    security: "Security (2FA)",
    dashboard: "Dashboard",
    branding: "Brand (logo)",
    agents: "Agents",
    home: "Home",
    customers: "Customers",
  },
  userMenu: {
    account: "Account",
    settings: "Settings",
    logout: "Sign out",
  },
  roles: {
    superadmin: "Superadmin",
    user: "User",
  },
} as const;

export default navigation;
