const store = {
  shell: {
    tenantFallback: "Your store",
    planLabel: "Plan {plan}",
    planUnknown: "Plan —",
    pointsDistributed: "Points distributed",
    transactionsMonth: "Transactions this month",
  },
  home: {
    title: "Dashboard",
    subtitle: "Overview of your loyalty program.",
    searchPlaceholder: "Search customer",
    notifications: "Notifications",
    newTransaction: "New transaction",
    kpis: {
      activeCustomers: "Active customers",
      pointsDistributed: "Points distributed",
      averageBasket: "Average basket",
      rewardsClaimed: "Rewards claimed",
    },
    panels: {
      pointsChart: "Points earned vs spent",
      pointsChartHint: "Monthly chart — coming soon.",
      tiers: "Tier distribution",
      tiersHint: "Bronze, Silver, Gold, Platinum — coming soon.",
    },
  },
  customers: {
    title: "Customers",
    subtitle: "Customer list and enrollment — coming soon.",
  },
  transactions: {
    title: "Transactions",
    subtitle: "Points history and in-store operations — coming soon.",
  },
  pointsRules: {
    title: "Points rules",
    subtitle: "Configure earning rules and conflicts — coming soon.",
  },
  rewards: {
    title: "Rewards",
    subtitle: "Catalog and redemption rules — coming soon.",
  },
  enrollmentQr: {
    title: "Enrollment QR",
    subtitle: "Share the store join QR — coming soon.",
  },
  campaigns: {
    title: "Campaigns",
    subtitle: "Marketing campaigns — coming soon.",
  },
  settings: {
    title: "Settings",
    subtitle: "Store preferences and branding — coming soon.",
  },
  branding: {
    title: "Brand",
    subtitle: "Logo and visual identity — coming soon.",
  },
  agents: {
    title: "Team & agents",
    invite: "Invite agent",
    inviteTitle: "Invite an agent",
    inviteDescription: "Send an activation link (token) to the agent. (Email UI later.)",
    email: "Email",
    role: "Role",
    createInvitation: "Create invitation",
    tokenLabel: "Token (share manually)",
    usersTitle: "Store users",
    usersDescription: "Users attached to this tenant (store scope).",
    loading: "Loading…",
    loadError: "Failed to load users",
    empty: "No users yet.",
    invalidEmail: "Invalid email",
  },
} as const;

export default store;
