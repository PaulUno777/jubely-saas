/**
 * Legacy `/v1/store/*` client — kept for the `/agent` portal until a later migration.
 * Merchant `/store` pages use `@/lib/tenant-admin` instead.
 */
import {
  listStoreCustomersSuccessEnvelopeSchema,
  listStorePointEventsSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  singleTenantSuccessEnvelopeSchema,
  storeMetricsSuccessEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { authedFetch, joinUrlWithQuery } from "./http";

export async function storeGetMetrics() {
  const res = await authedFetch("/v1/store/metrics", { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, storeMetricsSuccessEnvelopeSchema, res.status, text);
}

export async function storeGetTenant() {
  const res = await authedFetch("/v1/store/tenant", { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleTenantSuccessEnvelopeSchema, res.status, text);
}

export async function storeListCustomers(input: { offset?: number; limit?: number } = {}) {
  const res = await authedFetch(
    joinUrlWithQuery("/v1/store/customers", { offset: input.offset, limit: input.limit }),
    { method: "GET" },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listStoreCustomersSuccessEnvelopeSchema, res.status, text);
}

export async function storeListPointEvents(input: { offset?: number; limit?: number } = {}) {
  const res = await authedFetch(
    joinUrlWithQuery("/v1/store/transactions", { offset: input.offset, limit: input.limit }),
    { method: "GET" },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listStorePointEventsSuccessEnvelopeSchema, res.status, text);
}
