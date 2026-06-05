import {
  createCustomerSuccessEnvelopeSchema,
  createCustomerWireSchema,
  parseJsonUnknown,
  parseSuccessData,
  recordPurchaseSuccessEnvelopeSchema,
  recordPurchaseWireSchema,
  validateRedemptionSuccessEnvelopeSchema,
  validateRedemptionWireSchema,
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
  const phone = input.values.phone?.trim();
  const customerQr = input.values.customer_qr?.trim();
  const body = recordPurchaseWireSchema.parse({
    phone_e164: phone || undefined,
    customer_qr: customerQr || undefined,
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

export async function staffValidateRedemption(claimQr: string) {
  const body = validateRedemptionWireSchema.parse({ claim_qr: claimQr });
  const res = await authedFetch("/v1/staff/redemptions/validate", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(
    json,
    validateRedemptionSuccessEnvelopeSchema,
    res.status,
    text,
  );
}
