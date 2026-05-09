import { createCustomerSuccessEnvelopeSchema, createCustomerWireSchema, parseJsonUnknown, parseSuccessData, throwFailedApiResponse } from "@jubely/api-schemas";
import type { CreateCustomerForm } from "@jubely/api-schemas";
import { joinUrl, jsonHeaders } from "./http";

export async function staffCreateCustomer(input: { accessToken: string; values: CreateCustomerForm }) {
  const body = createCustomerWireSchema.parse({
    name: input.values.name.trim(),
    phone_e164: input.values.phone.trim(),
    email: input.values.email.trim() || undefined,
  });

  const res = await fetch(joinUrl("/v1/staff/customers"), {
    method: "POST",
    headers: jsonHeaders({ authorization: `Bearer ${input.accessToken}` }),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const data = parseSuccessData(json, createCustomerSuccessEnvelopeSchema, res.status, text);
  if (!data.customer_qr) {
    throw new Error("missing_customer_qr");
  }
  return data;
}

