import {
  enrollByStoreQrWireSchema,
  enrollSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  customerWalletSuccessEnvelopeSchema,
  listCustomerRewardsSuccessEnvelopeSchema,
  claimRewardSuccessEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { ClientEnrollForm, CustomerWallet } from "@jubely/api-schemas";
import { authedFetch, authedJson, joinUrl, joinUrlWithQuery, jsonHeaders } from "./http";

export async function enrollByStoreQr(values: ClientEnrollForm) {
  const body = enrollByStoreQrWireSchema.parse({
    store_qr: values.storeQr.trim(),
    phone_e164: values.phone.trim(),
    name: values.name.trim(),
    email: values.email.trim() || undefined,
    phone_verify_token: values.phoneVerifyToken?.trim() || undefined,
  });

  const res = await fetch(joinUrl("/v1/public/enrollments"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, enrollSuccessEnvelopeSchema, res.status, text);
}

export async function customerGetWallet(customerQr?: string) {
  if (!customerQr) {
    return authedJson<CustomerWallet>("/v1/customers/me/wallet");
  }
  const res = await fetch(joinUrlWithQuery("/v1/customers/wallet", { customer_qr: customerQr }), {
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, customerWalletSuccessEnvelopeSchema, res.status, text);
}

/** @deprecated Use customerGetWallet */
export const pwaGetWallet = customerGetWallet;

export async function customerAuthLogin(phoneVerifyToken: string) {
  const res = await fetch("/api/auth/customer/login", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify({ phone_verify_token: phoneVerifyToken }),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return json;
}

export async function customerListRewards(tenantId?: string) {
  const path = tenantId
    ? joinUrlWithQuery("/v1/customers/me/rewards", { tenant_id: tenantId })
    : "/v1/customers/me/rewards";
  const res = await authedFetch(path, { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listCustomerRewardsSuccessEnvelopeSchema, res.status, text);
}

export async function customerClaimReward(rewardId: string) {
  const res = await authedFetch(`/v1/customers/me/rewards/${encodeURIComponent(rewardId)}/claims`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, claimRewardSuccessEnvelopeSchema, res.status, text);
}

export async function customerSelectContext(enrollmentId: string) {
  const res = await fetch("/api/auth/customer/context", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify({ enrollment_id: enrollmentId }),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return json;
}
