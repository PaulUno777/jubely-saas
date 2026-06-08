/**
 * Agent portal client — tenant-scoped read APIs (replaces legacy `/v1/store/*`).
 */
import type { StoreCustomer, StoreMetrics, StorePointEvent, Tenant } from "@jubely/api-schemas";
import {
  getMetrics,
  getSettings,
  listCustomers,
  listTransactions,
  type TenantMetricsQuery,
} from "@/lib/tenant-admin";

function kpiValue(
  kpis: { key: string; value: number }[],
  key: string,
): number {
  return kpis.find((k) => k.key === key)?.value ?? 0;
}

export async function agentGetMetrics(tenantId: string): Promise<StoreMetrics> {
  const m = await getMetrics({ tenantId, period: "7d" } satisfies TenantMetricsQuery);
  return {
    points_distributed: kpiValue(m.kpis, "points_distributed"),
    point_events_this_month: kpiValue(m.kpis, "active_customers"),
  };
}

export async function agentGetTenant(tenantId: string): Promise<Tenant> {
  return getSettings(tenantId);
}

export async function agentListCustomers(
  tenantId: string,
  input: { offset?: number; limit?: number } = {},
): Promise<StoreCustomer[]> {
  const { customers } = await listCustomers({ tenantId, ...input });
  return customers.map((c) => ({
    enrollment_id: c.enrollment_id,
    customer_id: c.customer_id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? undefined,
    tier: c.tier.code,
    points_balance: c.points_balance,
    enrolled_at: c.enrolled_at,
  }));
}

export async function agentListPointEvents(
  tenantId: string,
  input: { offset?: number; limit?: number } = {},
): Promise<StorePointEvent[]> {
  const { transactions } = await listTransactions({ tenantId, ...input });
  return transactions;
}
