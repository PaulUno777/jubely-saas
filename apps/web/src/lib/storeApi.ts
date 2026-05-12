import {
  createInvitationSuccessEnvelopeSchema,
  createInvitationWireSchema,
  listStoreUsersSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  singleTenantSuccessEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { joinUrl, jsonHeaders } from "./http";

export async function storeGetTenant(input: { accessToken: string }) {
  const res = await fetch(joinUrl("/v1/store/tenant"), {
    headers: jsonHeaders({ authorization: `Bearer ${input.accessToken}` }),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleTenantSuccessEnvelopeSchema, res.status, text);
}

export async function storeListUsers(input: { accessToken: string; offset?: number; limit?: number }) {
  const url = new URL(joinUrl("/v1/store/users"));
  if (input.offset !== undefined) url.searchParams.set("offset", String(input.offset));
  if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));

  const res = await fetch(url.toString(), {
    headers: jsonHeaders({ authorization: `Bearer ${input.accessToken}` }),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, listStoreUsersSuccessEnvelopeSchema, res.status, text);
}

export async function storeCreateInvitation(input: { accessToken: string; email: string; role?: string }) {
  const body = createInvitationWireSchema.parse({ email: input.email, role: input.role });
  const res = await fetch(joinUrl("/v1/store/invitations"), {
    method: "POST",
    headers: jsonHeaders({ authorization: `Bearer ${input.accessToken}` }),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, createInvitationSuccessEnvelopeSchema, res.status, text);
}

