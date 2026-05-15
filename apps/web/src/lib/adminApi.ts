import {
  createTenantWireSchema,
  listStoreUsersSuccessEnvelopeSchema,
  listTenantsSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  singleTenantSuccessEnvelopeSchema,
  throwFailedApiResponse,
  type SuperadminStats,
  type Tenant,
} from "@jubely/api-schemas";
import { authedFetch, authedJson, joinUrl } from "./http";

const SUPER = "/v1/admin";

export async function adminListTenants(input: { offset?: number; limit?: number } = {}): Promise<Tenant[]> {
  const url = new URL(joinUrl(`${SUPER}/tenants`));
  if (input.offset !== undefined) url.searchParams.set("offset", String(input.offset));
  if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));

  const res = await authedFetch(url.toString(), { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) {
    throwFailedApiResponse(json, res.status, text);
  }
  return parseSuccessData(json, listTenantsSuccessEnvelopeSchema, res.status, text);
}

export async function adminGetTenant(input: { tenantId: string }): Promise<Tenant> {
  const res = await authedFetch(`${SUPER}/tenants/${input.tenantId}`, { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) {
    throwFailedApiResponse(json, res.status, text);
  }
  return parseSuccessData(json, singleTenantSuccessEnvelopeSchema, res.status, text);
}

export async function adminCreateTenant(input: {
  body: { name: string; slug: string; plan: string; self_serve?: boolean };
}): Promise<Tenant> {
  const wire = createTenantWireSchema.parse({
    name: input.body.name,
    slug: input.body.slug,
    plan: input.body.plan,
    self_serve: input.body.self_serve ?? false,
  });
  return authedJson<Tenant>(`${SUPER}/tenants`, {
    method: "POST",
    json: wire,
  });
}

export async function adminPatchTenant(input: { tenantId: string; body: Record<string, unknown> }): Promise<Tenant> {
  return authedJson<Tenant>(`${SUPER}/tenants/${input.tenantId}`, {
    method: "PATCH",
    json: input.body,
  });
}

export async function adminUploadTenantLogo(input: { file: File }): Promise<{ url: string }> {
  const fd = new FormData();
  fd.set("file", input.file);

  const res = await authedFetch(`${SUPER}/uploads/tenant-logo`, { method: "POST", body: fd });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);

  const url =
    typeof (json as { data?: { url?: unknown } })?.data?.url === "string" ? ((json as { data: { url: string } }).data.url as string) : "";
  if (!url) throw new Error("Upload logo: réponse invalide");
  return { url };
}

export async function adminCreateTenantUser(input: {
  tenantId: string;
  email: string;
  role?: string;
  temp_password?: string | null;
}): Promise<{ user_id: string; temp_password: string }> {
  return authedJson<{ user_id: string; temp_password: string }>(`${SUPER}/tenants/${input.tenantId}/users`, {
    method: "POST",
    json: {
      email: input.email,
      role: input.role ?? "merchant_admin",
      ...(input.temp_password !== undefined ? { temp_password: input.temp_password } : {}),
    },
  });
}

export type TenantUserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at?: string | number | Date;
};

export async function adminListTenantUsers(input: {
  tenantId: string;
  offset?: number;
  limit?: number;
}): Promise<TenantUserRow[]> {
  const url = new URL(joinUrl(`${SUPER}/tenants/${input.tenantId}/users`));
  if (input.offset !== undefined) url.searchParams.set("offset", String(input.offset));
  if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));
  const res = await authedFetch(url.toString(), { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) {
    throwFailedApiResponse(json, res.status, text);
  }
  return parseSuccessData(json, listStoreUsersSuccessEnvelopeSchema, res.status, text);
}

export async function adminSuperadminStats(): Promise<SuperadminStats> {
  return authedJson<SuperadminStats>(`${SUPER}/stats`, { method: "GET" });
}
