import { enrollByStoreQrWireSchema, enrollSuccessEnvelopeSchema, parseJsonUnknown, parseSuccessData, throwFailedApiResponse } from "@jubely/api-schemas";
import type { ClientEnrollForm } from "@jubely/api-schemas";
import { joinUrl, jsonHeaders } from "./http";

export async function enrollByStoreQr(values: ClientEnrollForm) {
  const body = enrollByStoreQrWireSchema.parse({
    store_qr: values.storeQr.trim(),
    phone_e164: values.phone.trim(),
    name: values.name.trim(),
    email: values.email.trim() || undefined,
  });

  const res = await fetch(joinUrl("/v1/pwa/enrollments/scan"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, enrollSuccessEnvelopeSchema, res.status, text);
}

