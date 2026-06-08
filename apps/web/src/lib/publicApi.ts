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

const phoneVerificationCreateEnvelope = z.object({
  data: z.object({ id: z.string().min(1), sent: z.literal(true) }),
});

const otpVerifyEnvelope = z.object({ data: z.object({ phone_verify_token: z.string().min(1) }) });

export async function publicGetTenantBySlug(slug: string) {
  const url = joinUrl(`/v1/public/tenant/${encodeURIComponent(slug)}`);
  const res = await fetch(url, { credentials: "include" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, publicTenantSuccessEnvelopeSchema, res.status, text);
}

export async function publicOtpSend(phoneE164: string) {
  const res = await fetch(joinUrl("/v1/public/phone-verifications"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ phone_e164: phoneE164 }),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const parsed = phoneVerificationCreateEnvelope.safeParse(json);
  if (!parsed.success) throw new Error("invalid_response");
  return parsed.data.data;
}

export async function publicOtpVerify(verificationId: string, code: string) {
  const res = await fetch(
    joinUrl(`/v1/public/phone-verifications/${encodeURIComponent(verificationId)}/confirmations`),
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ code }),
      credentials: "include",
    },
  );
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
  const body = acceptInvitationWireSchema.parse({ status: "accepted", password });
  const res = await fetch(joinUrl(`/v1/invitations/${encodeURIComponent(token)}`), {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, acceptInvitationSuccessEnvelopeSchema, res.status, text);
}
