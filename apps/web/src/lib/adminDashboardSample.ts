export type AdminKpiTone = "emerald" | "teal" | "gold" | "danger";

export type AdminKpiSample = {
  labelKey: "mrrTotal" | "tenantsActive" | "endCustomers" | "systemAlerts";
  value: string;
  delta: string;
  detail: string;
  tone: AdminKpiTone;
  sparkline: number[];
  live?: boolean;
};

export type AdminMrrMonth = {
  label: string;
  value: number;
  current?: boolean;
};

export type AdminPlanSplit = {
  plan: string;
  count: number;
  revenue: string;
};

export type AdminTenantRow = {
  id: string;
  name: string;
  initials: string;
  color: string;
  plan: string;
  customers: string;
  mrr: string;
  status: "active" | "trial" | "suspended" | "late";
};

export type AdminAlertRow = {
  tone: "danger" | "gold" | "teal";
  title: string;
  detail: string;
};

export type AdminInfraRow = {
  label: string;
  value: string;
  progress: number;
  tone: "emerald" | "gold" | "teal";
};

export type AdminAuditRow = {
  tone: "emerald" | "gold" | "danger" | "teal";
  title: string;
  target: string;
  actor: string;
  when: string;
};

export type AdminPlanMrrRow = {
  plan: string;
  amount: string;
  progress: number;
  tone: AdminKpiTone;
};

export const adminDashboardSample = {
  kpis: [
    {
      labelKey: "mrrTotal",
      value: "2.87M FCFA",
      delta: "+18.4%",
      detail: "per month",
      tone: "emerald",
      sparkline: [42, 48, 45, 58, 62, 71, 78, 84],
      live: true,
    },
    {
      labelKey: "tenantsActive",
      value: "24",
      delta: "+14.3%",
      detail: "+3 this month · 2 trials",
      tone: "teal",
      sparkline: [12, 14, 15, 16, 18, 20, 22, 24],
    },
    {
      labelKey: "endCustomers",
      value: "12,847",
      delta: "+10.3%",
      detail: "+1,204 vs last month",
      tone: "gold",
      sparkline: [8200, 8800, 9100, 9800, 10400, 11200, 12100, 12847],
    },
    {
      labelKey: "systemAlerts",
      value: "3",
      delta: "Action required",
      detail: "2 late payments",
      tone: "danger",
      sparkline: [1, 2, 1, 3, 2, 4, 3, 3],
    },
  ] satisfies AdminKpiSample[],
  mrrMonths: [
    { label: "Nov", value: 1.8 },
    { label: "Dec", value: 2.0 },
    { label: "Jan", value: 2.1 },
    { label: "Feb", value: 2.3 },
    { label: "Mar", value: 2.5 },
    { label: "Apr", value: 2.87, current: true },
  ] satisfies AdminMrrMonth[],
  mrrSummary: {
    current: "2.87M FCFA",
    growth30d: "+18.4%",
    projectedArr: "34.4M FCFA",
  },
  planSplit: [
    { plan: "Business", count: 8, revenue: "1.42M" },
    { plan: "Growth", count: 10, revenue: "1.05M" },
    { plan: "Starter", count: 4, revenue: "0.28M" },
    { plan: "Trial", count: 2, revenue: "0.12M" },
  ] satisfies AdminPlanSplit[],
  tenants: [
    {
      id: "chez-mama",
      name: "Chez Mama",
      initials: "CM",
      color: "#c89b3c",
      plan: "Growth",
      customers: "1,248",
      mrr: "184K",
      status: "active",
    },
    {
      id: "boulangerie-soleil",
      name: "Boulangerie Soleil",
      initials: "BS",
      color: "#1fa971",
      plan: "Business",
      customers: "892",
      mrr: "312K",
      status: "active",
    },
    {
      id: "cafe-riviera",
      name: "Café Riviera",
      initials: "CR",
      color: "#0f766e",
      plan: "Starter",
      customers: "214",
      mrr: "48K",
      status: "trial",
    },
    {
      id: "market-nord",
      name: "Market Nord",
      initials: "MN",
      color: "#e07070",
      plan: "Growth",
      customers: "563",
      mrr: "96K",
      status: "late",
    },
  ] satisfies AdminTenantRow[],
  alerts: [
    {
      tone: "danger",
      title: "Payment 12 days late",
      detail: "Market Nord · Growth plan",
    },
    {
      tone: "gold",
      title: "Trial expires in 3 days",
      detail: "Café Riviera · Starter plan",
    },
    {
      tone: "teal",
      title: "API webhook failures",
      detail: "Boulangerie Soleil · 4 retries in 1h",
    },
  ] satisfies AdminAlertRow[],
  infrastructure: [
    { label: "API Go", value: "42ms", progress: 88, tone: "emerald" },
    { label: "PostgreSQL", value: "99.98%", progress: 99, tone: "emerald" },
    { label: "Redis", value: "1.2ms", progress: 94, tone: "teal" },
    { label: "SMS Nexah", value: "98.1%", progress: 91, tone: "teal" },
    { label: "BullMQ", value: "47 jobs", progress: 62, tone: "gold" },
    { label: "Fly.io", value: "3 instances", progress: 100, tone: "emerald" },
  ] satisfies AdminInfraRow[],
  planMrr: [
    { plan: "Business", amount: "1.42M", progress: 49, tone: "emerald" },
    { plan: "Growth", amount: "1.05M", progress: 37, tone: "gold" },
    { plan: "Starter", amount: "0.28M", progress: 10, tone: "teal" },
    { plan: "Trial", amount: "0.12M", progress: 4, tone: "danger" },
  ] satisfies AdminPlanMrrRow[],
  audit: [
    {
      tone: "emerald",
      title: "Tenant created",
      target: "Chez Mama",
      actor: "root@jubelee.app",
      when: "2h ago",
    },
    {
      tone: "gold",
      title: "Plan updated",
      target: "Boulangerie Soleil",
      actor: "root@jubelee.app",
      when: "5h ago",
    },
    {
      tone: "danger",
      title: "Tenant suspended",
      target: "Market Nord",
      actor: "root@jubelee.app",
      when: "Yesterday",
    },
    {
      tone: "teal",
      title: "Admin created",
      target: "Café Riviera",
      actor: "root@jubelee.app",
      when: "Yesterday",
    },
    {
      tone: "gold",
      title: "Root login",
      target: "Production portal",
      actor: "root@jubelee.app",
      when: "2 days ago",
    },
  ] satisfies AdminAuditRow[],
} as const;
