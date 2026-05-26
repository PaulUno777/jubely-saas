import {
  enrollByStoreQrWireSchema,
  enrollSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  pwaWalletSuccessEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { ClientEnrollForm, PwaWallet } from "@jubely/api-schemas";
import { authedJson, joinUrl, joinUrlWithQuery, jsonHeaders } from "./http";

export async function enrollByStoreQr(values: ClientEnrollForm) {
  const body = enrollByStoreQrWireSchema.parse({
    store_qr: values.storeQr.trim(),
    phone_e164: values.phone.trim(),
    name: values.name.trim(),
    email: values.email.trim() || undefined,
    phone_verify_token: values.phoneVerifyToken?.trim() || undefined,
  });

  const res = await fetch(joinUrl("/v1/pwa/enrollments/scan"), {
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

export async function pwaGetWallet(customerQr?: string) {
  if (!customerQr) {
    return authedJson<PwaWallet>("/v1/pwa/wallet");
  }
  const res = await fetch(joinUrlWithQuery("/v1/pwa/wallet", { customer_qr: customerQr }), {
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, pwaWalletSuccessEnvelopeSchema, res.status, text);
}

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

