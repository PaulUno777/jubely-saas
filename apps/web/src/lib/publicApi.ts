import {
  acceptInvitationSuccessEnvelopeSchema,
  acceptInvitationWireSchema,
  invitationPreviewSuccessEnvelopeSchema,
  publicTenantSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { z } from "zod";
import { joinUrl, jsonHeaders } from "./http";

const otpSendOk = z.object({ sent: z.literal(true) });
const otpSendEnvelope = z.object({ data: otpSendOk });

const otpVerifyOk = z.object({ phone_verify_token: z.string().min(1) });
const otpVerifyEnvelope = z.object({ data: otpVerifyOk });

export async function publicGetTenantBySlug(slug: string) {
  const url = joinUrl(`/v1/public/tenant/${encodeURIComponent(slug)}`);
  const res = await fetch(url, { credentials: "include" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, publicTenantSuccessEnvelopeSchema, res.status, text);
}

export async function publicOtpSend(phoneE164: string) {
  const res = await fetch(joinUrl("/v1/public/otp/send"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ phone_e164: phoneE164 }),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const parsed = otpSendEnvelope.safeParse(json);
  if (!parsed.success) throw new Error("invalid_response");
  return parsed.data.data;
}

export async function publicOtpVerify(phoneE164: string, code: string) {
  const res = await fetch(joinUrl("/v1/public/otp/verify"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ phone_e164: phoneE164, code }),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const parsed = otpVerifyEnvelope.safeParse(json);
  if (!parsed.success) throw new Error("invalid_response");
  return parsed.data.data;
}

export async function publicGetInvitationPreview(token: string) {
  const res = await fetch(joinUrl(`/v1/invitations/${encodeURIComponent(token)}`), {
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, invitationPreviewSuccessEnvelopeSchema, res.status, text);
}

export async function publicAcceptInvitation(token: string, password: string) {
  const body = acceptInvitationWireSchema.parse({ password });
  const res = await fetch(joinUrl(`/v1/invitations/${encodeURIComponent(token)}/accept`), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, acceptInvitationSuccessEnvelopeSchema, res.status, text);
}
