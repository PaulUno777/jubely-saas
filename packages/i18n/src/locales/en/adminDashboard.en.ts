export const comingSoonPagesEn = {
  badge: "Coming soon",
  revenue: {
    title: "Revenue & MRR",
    subtitle: "Consolidated billing and MRR analytics will appear here in a later phase.",
  },
  users: {
    title: "Cross-tenant users",
    subtitle: "Directory and search across all merchant accounts are not part of Phase 1.",
  },
  subscriptions: {
    title: "Subscriptions",
    subtitle: "Plan renewals, invoices, and dunning will be wired when billing is integrated.",
  },
  plans: {
    title: "Plans & pricing",
    subtitle: "Catalog management and price books will live here in a future release.",
  },
  integrations: {
    title: "API & integrations",
    subtitle: "Webhooks, API keys, and partner connectors are planned after core loyalty flows.",
  },
  system: {
    title: "System health",
    subtitle: "Live probes and dependency status will replace dashboard samples when telemetry is connected.",
  },
  audit: {
    title: "Logs & audit",
    subtitle: "Immutable audit trails and export will ship with compliance milestones.",
  },
} as const;

export const sampleDashboardEn = {
  kpis: {
    mrrTotal: { detail: "per month", delta: "+18.4%" },
    tenantsActive: { detail: "+3 this month · 2 trials", delta: "+14.3%" },
    endCustomers: { detail: "+1,204 vs last month", delta: "+10.3%" },
    systemAlerts: { detail: "2 late payments", delta: "Action required" },
  },
  mrrSummary: {
    current: "2.87M FCFA",
    growth30d: "+18.4%",
    projectedArr: "34.4M FCFA",
  },
  mrrMonths: {
    nov: "Nov",
    dec: "Dec",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
  },
  planNames: {
    business: "Business",
    growth: "Growth",
    starter: "Starter",
    trial: "Trial",
  },
  tenants: {
    chezMama: { name: "Chez Mama" },
    boulangerieSoleil: { name: "Boulangerie Soleil" },
    cafeRiviera: { name: "Café Riviera" },
    marketNord: { name: "Market Nord" },
  },
  alerts: {
    paymentLate: {
      title: "Payment 12 days late",
      detail: "Market Nord · Growth plan",
    },
    trialExpires: {
      title: "Trial expires in 3 days",
      detail: "Café Riviera · Starter plan",
    },
    webhookFailures: {
      title: "API webhook failures",
      detail: "Boulangerie Soleil · 4 retries in 1h",
    },
  },
  infrastructure: {
    apiGo: { label: "API Go", value: "42ms" },
    postgres: { label: "PostgreSQL", value: "99.98%" },
    redis: { label: "Redis", value: "1.2ms" },
    sms: { label: "SMS Nexah", value: "98.1%" },
    bullmq: { label: "BullMQ", value: "47 jobs" },
    fly: { label: "Fly.io", value: "3 instances" },
  },
  audit: {
    tenantCreated: {
      title: "Tenant created",
      target: "Chez Mama",
      actor: "root@jubelee.app",
      when: "2h ago",
    },
    planUpdated: {
      title: "Plan updated",
      target: "Boulangerie Soleil",
      actor: "root@jubelee.app",
      when: "5h ago",
    },
    tenantSuspended: {
      title: "Tenant suspended",
      target: "Market Nord",
      actor: "root@jubelee.app",
      when: "Yesterday",
    },
    adminCreated: {
      title: "Admin created",
      target: "Café Riviera",
      actor: "root@jubelee.app",
      when: "Yesterday",
    },
    rootLogin: {
      title: "Root login",
      target: "Production portal",
      actor: "root@jubelee.app",
      when: "2 days ago",
    },
  },
} as const;
