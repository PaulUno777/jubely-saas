import {
  createInvitationSuccessEnvelopeSchema,
  createInvitationWireSchema,
  listStoreUsersSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  patchStoreTenantWireSchema,
  singleTenantSuccessEnvelopeSchema,
  storeMetricsSuccessEnvelopeSchema,
  storeQrSuccessEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { authedFetch, joinUrl, jsonHeaders } from "./http";

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

export async function storePatchTenant(input: { body: { name?: string; conflict_policy?: string; settings?: unknown } }) {
  const body = patchStoreTenantWireSchema.parse(input.body);
  const res = await authedFetch("/v1/store/tenant", {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleTenantSuccessEnvelopeSchema, res.status, text);
}

export async function storeGetStoreQR() {
  const res = await authedFetch("/v1/store/qr", { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, storeQrSuccessEnvelopeSchema, res.status, text);
}

export async function storeListUsers(input: { offset?: number; limit?: number } = {}) {
  const url = new URL(joinUrl("/v1/store/users"));
  if (input.offset !== undefined) url.searchParams.set("offset", String(input.offset));
  if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));

  const res = await authedFetch(url.toString(), { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listStoreUsersSuccessEnvelopeSchema, res.status, text);
}

export async function storeCreateInvitation(input: { email: string; role?: string }) {
  const body = createInvitationWireSchema.parse({ email: input.email, role: input.role });
  const res = await authedFetch("/v1/store/invitations", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, createInvitationSuccessEnvelopeSchema, res.status, text);
}
