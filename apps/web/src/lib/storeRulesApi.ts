import {
  listStoreRulesSuccessEnvelopeSchema,
  simulateRulesSuccessEnvelopeSchema,
  simulateRulesWireSchema,
  loyaltyRuleSchema,
  successEnvelopeSchema,
  storeRuleRecordSchema,
  parseJsonUnknown,
  parseSuccessData,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { z } from "zod";
import { authedFetch, jsonHeaders } from "./http";

const singleRuleEnvelope = successEnvelopeSchema(storeRuleRecordSchema);

export async function storeListRules() {
  const res = await authedFetch("/v1/store/rules", { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  const data = parseSuccessData(json, listStoreRulesSuccessEnvelopeSchema, res.status, text);
  return data.rules;
}

export async function storeCreateRule(input: {
  rule: z.infer<typeof loyaltyRuleSchema>;
  priority?: number;
  active?: boolean;
}) {
  const res = await authedFetch("/v1/store/rules", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      rule: input.rule,
      priority: input.priority ?? 0,
      active: input.active ?? true,
    }),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleRuleEnvelope, res.status, text);
}

export async function storeSimulateRules(input: z.infer<typeof simulateRulesWireSchema>) {
  const body = simulateRulesWireSchema.parse(input);
  const res = await authedFetch("/v1/store/rules/simulate", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, simulateRulesSuccessEnvelopeSchema, res.status, text);
}
