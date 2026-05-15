import {
  createCustomerSuccessEnvelopeSchema,
  createCustomerWireSchema,
  parseJsonUnknown,
  parseSuccessData,
  recordPurchaseSuccessEnvelopeSchema,
  recordPurchaseWireSchema,
  throwFailedApiResponse,
  type CreateCustomerForm,
  type RecordPurchaseForm,
} from "@jubely/api-schemas";
import { authedFetch, jsonHeaders } from "./http";

export async function staffCreateCustomer(input: {
  values: CreateCustomerForm;
}) {
  const body = createCustomerWireSchema.parse({
    name: input.values.name.trim(),
    phone_e164: input.values.phone.trim(),
    email: input.values.email.trim() || undefined,
  });
  const res = await authedFetch("/v1/staff/customers", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(
    json,
    createCustomerSuccessEnvelopeSchema,
    res.status,
    text,
  );
}

export async function staffRecordPurchase(input: { values: RecordPurchaseForm }) {
  const body = recordPurchaseWireSchema.parse({
    phone_e164: input.values.phone.trim(),
    amount_fcfa: input.values.amount_fcfa,
  });
  const res = await authedFetch("/v1/staff/purchases", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(
    json,
    recordPurchaseSuccessEnvelopeSchema,
    res.status,
    text,
  );
}
