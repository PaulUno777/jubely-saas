const navigation = {
  groups: {
    system: "System",
    operations: "Operations",
    store: "Store",
    account: "Account",
    team: "Team",
    customer: "Customer",
    dashboard: "Dashboard",
    configuration: "Configuration",
    marketing: "Marketing",
  },
  items: {
    globalOverview: "Overview",
    tenants: "Tenants",
    security: "Security (2FA)",
    dashboard: "Dashboard",
    overview: "Overview",
    branding: "Brand (logo)",
    agents: "Agents",
    teamAgents: "Team & agents",
    home: "Home",
    customers: "Customers",
    transactions: "Transactions",
    pointsRules: "Points rules",
    rewards: "Rewards",
    enrollmentQr: "Enrollment QR",
    campaigns: "Campaigns",
    settings: "Settings",
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
