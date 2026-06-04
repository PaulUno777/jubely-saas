import type { AdminKpiTone } from "@/components/dashboard/admin-kpi-card";

export type { AdminKpiTone };

export type AdminKpiLabelKey = "mrrTotal" | "tenantsActive" | "endCustomers" | "systemAlerts";

export type AdminKpiSample = {
  labelKey: AdminKpiLabelKey;
  value: string;
  delta: string;
  detail: string;
  tone: AdminKpiTone;
  sparkline: number[];
  live?: boolean;
};

export type AdminMrrMonth = {
  labelKey: "nov" | "dec" | "jan" | "feb" | "mar" | "apr";
  value: number;
  current?: boolean;
};

export type AdminPlanKey = "business" | "growth" | "starter" | "trial";

export type AdminPlanSplit = {
  planKey: AdminPlanKey;
  count: number;
  revenue: string;
};

export type AdminTenantSampleId = "chezMama" | "boulangerieSoleil" | "cafeRiviera" | "marketNord";

export type AdminTenantRow = {
  id: string;
  sampleId?: AdminTenantSampleId;
  name: string;
  planKey?: AdminPlanKey;
  /** Live tenant plan label from API when `sampleId` is absent. */
  plan?: string;
  initials: string;
  color: string;
  customers: string;
  mrr: string;
  status: "active" | "trial" | "suspended" | "late";
};

export type AdminAlertId = "paymentLate" | "trialExpires" | "webhookFailures";

export type AdminAlertRow = {
  id: AdminAlertId;
  tone: "danger" | "gold" | "teal";
};

export type AdminInfraId = "apiGo" | "postgres" | "redis" | "sms" | "bullmq" | "fly";

export type AdminInfraRow = {
  id: AdminInfraId;
  progress: number;
  tone: "emerald" | "gold" | "teal";
};

export type AdminAuditId = "tenantCreated" | "planUpdated" | "tenantSuspended" | "adminCreated" | "rootLogin";

export type AdminAuditRow = {
  id: AdminAuditId;
  tone: "emerald" | "gold" | "danger" | "teal";
};

export type AdminPlanMrrRow = {
  planKey: AdminPlanKey;
  amount: string;
  progress: number;
  tone: AdminKpiTone;
};

export const adminDashboardSample = {
  kpis: [
    {
      labelKey: "mrrTotal",
      value: "2.87M FCFA",
      delta: "",
      detail: "",
      tone: "emerald",
      sparkline: [42, 48, 45, 58, 62, 71, 78, 84],
      live: true,
    },
    {
      labelKey: "tenantsActive",
      value: "24",
      delta: "",
      detail: "",
      tone: "teal",
      sparkline: [12, 14, 15, 16, 18, 20, 22, 24],
    },
    {
      labelKey: "endCustomers",
      value: "12,847",
      delta: "",
      detail: "",
      tone: "gold",
      sparkline: [8200, 8800, 9100, 9800, 10400, 11200, 12100, 12847],
    },
    {
      labelKey: "systemAlerts",
      value: "3",
      delta: "",
      detail: "",
      tone: "danger",
      sparkline: [1, 2, 1, 3, 2, 4, 3, 3],
    },
  ] satisfies AdminKpiSample[],
  mrrMonths: [
    { labelKey: "nov", value: 1.8 },
    { labelKey: "dec", value: 2.0 },
    { labelKey: "jan", value: 2.1 },
    { labelKey: "feb", value: 2.3 },
    { labelKey: "mar", value: 2.5 },
    { labelKey: "apr", value: 2.87, current: true },
  ] satisfies AdminMrrMonth[],
  planSplit: [
    { planKey: "business", count: 8, revenue: "1.42M" },
    { planKey: "growth", count: 10, revenue: "1.05M" },
    { planKey: "starter", count: 4, revenue: "0.28M" },
    { planKey: "trial", count: 2, revenue: "0.12M" },
  ] satisfies AdminPlanSplit[],
  tenants: [
    {
      id: "chez-mama",
      sampleId: "chezMama",
      name: "",
      initials: "CM",
      color: "#c89b3c",
      planKey: "growth",
      customers: "1,248",
      mrr: "184K",
      status: "active",
    },
    {
      id: "boulangerie-soleil",
      sampleId: "boulangerieSoleil",
      name: "",
      initials: "BS",
      color: "#1fa971",
      planKey: "business",
      customers: "892",
      mrr: "312K",
      status: "active",
    },
    {
      id: "cafe-riviera",
      sampleId: "cafeRiviera",
      name: "",
      initials: "CR",
      color: "#0f766e",
      planKey: "starter",
      customers: "214",
      mrr: "48K",
      status: "trial",
    },
    {
      id: "market-nord",
      sampleId: "marketNord",
      name: "",
      initials: "MN",
      color: "#e07070",
      planKey: "growth",
      customers: "563",
      mrr: "96K",
      status: "late",
    },
  ] satisfies AdminTenantRow[],
  alerts: [
    { id: "paymentLate", tone: "danger" },
    { id: "trialExpires", tone: "gold" },
    { id: "webhookFailures", tone: "teal" },
  ] satisfies AdminAlertRow[],
  infrastructure: [
    { id: "apiGo", progress: 88, tone: "emerald" },
    { id: "postgres", progress: 99, tone: "emerald" },
    { id: "redis", progress: 94, tone: "teal" },
    { id: "sms", progress: 91, tone: "teal" },
    { id: "bullmq", progress: 62, tone: "gold" },
    { id: "fly", progress: 100, tone: "emerald" },
  ] satisfies AdminInfraRow[],
  planMrr: [
    { planKey: "business", amount: "1.42M", progress: 49, tone: "emerald" },
    { planKey: "growth", amount: "1.05M", progress: 37, tone: "gold" },
    { planKey: "starter", amount: "0.28M", progress: 10, tone: "teal" },
    { planKey: "trial", amount: "0.12M", progress: 4, tone: "danger" },
  ] satisfies AdminPlanMrrRow[],
  audit: [
    { id: "tenantCreated", tone: "emerald" },
    { id: "planUpdated", tone: "gold" },
    { id: "tenantSuspended", tone: "danger" },
    { id: "adminCreated", tone: "teal" },
    { id: "rootLogin", tone: "gold" },
  ] satisfies AdminAuditRow[],
} as const;
