import {
  apiMetaSchema,
  parseJsonUnknown,
  parseSuccessData,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { z } from "zod";
import { authedFetch, joinUrlWithQuery, jsonHeaders } from "@/lib/http";

export type TenantQueryBase = {
  tenantId: string;
  from?: string;
  to?: string;
  period?: string;
  locationId?: string;
  offset?: number;
  limit?: number;
};

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export function buildTenantPath(tenantId: string, segment: string): string {
  const base = `/v1/tenants/${encodeURIComponent(tenantId)}`;
  if (!segment) return base;
  return segment.startsWith("/") ? `${base}${segment}` : `${base}/${segment}`;
}

export function serializeTenantQuery(
  input: TenantQueryBase & Record<string, string | number | boolean | undefined | null>,
): Record<string, string | number | boolean | undefined> {
  const q: Record<string, string | number | boolean | undefined> = {};
  if (input.from) q.from = input.from;
  if (input.to) q.to = input.to;
  if (input.period) q.period = input.period;
  if (input.locationId) q.location_id = input.locationId;
  if (input.offset != null) q.offset = input.offset;
  if (input.limit != null) q.limit = input.limit;
  for (const [k, v] of Object.entries(input)) {
    if (["tenantId", "from", "to", "period", "locationId", "offset", "limit"].includes(k)) continue;
    if (v != null && v !== "") q[k] = v as string | number | boolean;
  }
  return q;
}

export async function tenantFetch<TData>(
  path: string,
  envelopeSchema: z.ZodType<{ data: TData }>,
  init?: RequestInit,
): Promise<TData> {
  const res = await authedFetch(path, { method: "GET", ...init });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, envelopeSchema, res.status, text);
}

export async function tenantFetchPaginated<TData>(
  path: string,
  envelopeSchema: z.ZodType<{ data: TData }>,
): Promise<{ data: TData; pagination?: Pagination }> {
  const res = await authedFetch(path, { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const data = parseSuccessData(json, envelopeSchema, res.status, text);
  const meta = apiMetaSchema.safeParse((json as { meta?: unknown }).meta);
  return {
    data,
    pagination: meta.success ? meta.data.pagination : undefined,
  };
}

export async function tenantMutate<TData>(
  path: string,
  envelopeSchema: z.ZodType<{ data: TData }>,
  init: RequestInit,
): Promise<TData> {
  const res = await authedFetch(path, init);
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, envelopeSchema, res.status, text);
}

export function tenantGetPath(tenantId: string, segment: string, query?: TenantQueryBase) {
  const q = query ? serializeTenantQuery(query) : undefined;
  return joinUrlWithQuery(
    buildTenantPath(tenantId, segment),
    q as Record<string, string | number | undefined> | undefined,
  );
}

export const jsonPost = (body: unknown): RequestInit => ({
  method: "POST",
  headers: jsonHeaders(),
  body: JSON.stringify(body),
});

export const jsonPatch = (body: unknown): RequestInit => ({
  method: "PATCH",
  headers: jsonHeaders(),
  body: JSON.stringify(body),
});

export const jsonPut = (body: unknown): RequestInit => ({
  method: "PUT",
  headers: jsonHeaders(),
  body: JSON.stringify(body),
});

export const jsonDelete = (): RequestInit => ({
  method: "DELETE",
  headers: jsonHeaders(),
});
