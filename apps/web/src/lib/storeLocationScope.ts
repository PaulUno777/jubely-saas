import type { TenantLocation } from "@jubely/api-schemas";
import {
  parseJsonUnknown,
  parseSuccessData,
  successEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { applyAuthSession } from "@/lib/session";
import { z } from "zod";

const workspaceDataSchema = z.object({
  user_id: z.string(),
  membership_id: z.string().nullable().optional(),
  tenant_id: z.string().nullable().optional(),
  active_store_id: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  email: z.string().optional(),
});

const workspaceEnvelopeSchema = successEnvelopeSchema(workspaceDataSchema);

export function resolveActiveLocation(
  locations: TenantLocation[] | undefined,
  activeStoreId: string | undefined,
): TenantLocation | undefined {
  if (!activeStoreId || !locations?.length) return undefined;
  return locations.find((l) => l.id === activeStoreId);
}

export function merchantSidebarLocationLabel(
  locations: TenantLocation[] | undefined,
  activeLocation: TenantLocation | undefined,
  labels: {
    locationsCount: (count: string) => string;
    singleLocation: (name: string) => string;
  },
): string | null {
  const count = locations?.length ?? 0;
  if (count === 0) return null;
  if (activeLocation) {
    return labels.singleLocation(activeLocation.name);
  }
  return labels.locationsCount(String(count));
}

export function merchantHeaderContextLabel(
  tenantName: string,
  activeLocation: TenantLocation | undefined,
): string {
  if (!activeLocation) return tenantName;
  const place = activeLocation.city
    ? `${activeLocation.name}, ${activeLocation.city}`
    : activeLocation.name;
  return `${tenantName} · ${place}`;
}

export async function selectMerchantActiveLocation(
  membershipId: string,
  activeStoreId: string | null,
): Promise<void> {
  const body: { membership_id: string; active_store_id?: string } = {
    membership_id: membershipId,
  };
  if (activeStoreId) {
    body.active_store_id = activeStoreId;
  }

  const res = await fetch("/api/auth/workspace", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const data = parseSuccessData(json, workspaceEnvelopeSchema, res.status, text);
  applyAuthSession({
    user_id: data.user_id,
    membership_id: data.membership_id,
    tenant_id: data.tenant_id,
    active_store_id: data.active_store_id,
    role: data.role,
    email: data.email,
  });
}
