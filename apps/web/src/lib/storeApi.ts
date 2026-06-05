import {
  createInvitationSuccessEnvelopeSchema,
  createInvitationWireSchema,
  listStoreCustomersSuccessEnvelopeSchema,
  listStorePointEventsSuccessEnvelopeSchema,
  listStoreUsersSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  patchStoreTenantWireSchema,
  singleTenantSuccessEnvelopeSchema,
  storeMetricsSuccessEnvelopeSchema,
  storeQrSuccessEnvelopeSchema,
  listStoreRewardsSuccessEnvelopeSchema,
  createStoreRewardWireSchema,
  patchStoreRewardWireSchema,
  storeRewardSchema,
  successEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { z } from "zod";

const singleStoreRewardEnvelopeSchema = successEnvelopeSchema(storeRewardSchema);
import { authedFetch, joinUrlWithQuery, jsonHeaders } from "./http";

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

export async function storePatchTenant(input: {
  body: {
    name?: string;
    conflict_policy?: string;
    allow_staff_self_enrollment?: boolean;
    settings?: unknown;
  };
}) {
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
  const res = await authedFetch(
    joinUrlWithQuery("/v1/store/users", { offset: input.offset, limit: input.limit }),
    { method: "GET" },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listStoreUsersSuccessEnvelopeSchema, res.status, text);
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

export async function storeListRewards(activeOnly = true) {
  const res = await authedFetch(
    joinUrlWithQuery("/v1/store/rewards", { active: activeOnly ? undefined : "false" }),
    { method: "GET" },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const data = parseSuccessData(json, listStoreRewardsSuccessEnvelopeSchema, res.status, text);
  return data.rewards;
}

export async function storeCreateReward(input: z.infer<typeof createStoreRewardWireSchema>) {
  const body = createStoreRewardWireSchema.parse(input);
  const res = await authedFetch("/v1/store/rewards", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleStoreRewardEnvelopeSchema, res.status, text);
}

export async function storePatchReward(
  rewardId: string,
  input: z.infer<typeof patchStoreRewardWireSchema>,
) {
  const body = patchStoreRewardWireSchema.parse(input);
  const res = await authedFetch(`/v1/store/rewards/${encodeURIComponent(rewardId)}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleStoreRewardEnvelopeSchema, res.status, text);
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
