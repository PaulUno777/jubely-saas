import {
  tenantCreateRuleWireSchema,
  tenantPatchRuleWireSchema,
  tenantRuleSuccessEnvelopeSchema,
  tenantRulesListSuccessEnvelopeSchema,
  tenantSimulateRulesSuccessEnvelopeSchema,
  tenantSimulateRulesWireSchema,
  tenantTiersSuccessEnvelopeSchema,
  tenantUpsertTierWireSchema,
  validateRulesSuccessEnvelopeSchema,
} from "@jubely/api-schemas";
import type { z } from "zod";
import {
  buildTenantPath,
  jsonPatch,
  jsonPost,
  jsonPut,
  tenantFetch,
  tenantMutate,
} from "./core";

export async function listRules(tenantId: string) {
  const data = await tenantFetch(
    buildTenantPath(tenantId, "rules"),
    tenantRulesListSuccessEnvelopeSchema,
  );
  return data.rules;
}

export async function createRule(
  tenantId: string,
  input: z.infer<typeof tenantCreateRuleWireSchema>,
) {
  const payload = tenantCreateRuleWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, "rules"),
    tenantRuleSuccessEnvelopeSchema,
    jsonPost({
      rule: payload.rule,
      priority: payload.priority ?? 0,
      active: payload.active ?? true,
    }),
  );
}

export async function patchRule(
  tenantId: string,
  ruleId: string,
  input: z.infer<typeof tenantPatchRuleWireSchema>,
) {
  const payload = tenantPatchRuleWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, `rules/${encodeURIComponent(ruleId)}`),
    tenantRuleSuccessEnvelopeSchema,
    jsonPatch(payload),
  );
}

export async function simulateRules(
  tenantId: string,
  input: z.infer<typeof tenantSimulateRulesWireSchema>,
) {
  const payload = tenantSimulateRulesWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, "rule-simulations"),
    tenantSimulateRulesSuccessEnvelopeSchema,
    jsonPost(payload),
  );
}

export async function validateRules(tenantId: string) {
  return tenantMutate(
    buildTenantPath(tenantId, "rule-validations"),
    validateRulesSuccessEnvelopeSchema,
    { method: "POST" },
  );
}

export async function listTiers(tenantId: string) {
  const data = await tenantFetch(
    buildTenantPath(tenantId, "tiers"),
    tenantTiersSuccessEnvelopeSchema,
  );
  return data.tiers;
}

export async function upsertTier(
  tenantId: string,
  body: z.infer<typeof tenantUpsertTierWireSchema>,
) {
  const payload = tenantUpsertTierWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, `tiers/${encodeURIComponent(payload.code)}`),
    tenantTiersSuccessEnvelopeSchema,
    jsonPut(payload),
  );
}
