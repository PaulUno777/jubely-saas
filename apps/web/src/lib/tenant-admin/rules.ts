import {
  listRuleVersionsSuccessEnvelopeSchema,
  rulesHealthSuccessEnvelopeSchema,
  successEnvelopeSchema,
  tenantCreateRuleWireSchema,
  tenantPatchRuleWireSchema,
  tenantRuleSuccessEnvelopeSchema,
  tenantRulesListSuccessEnvelopeSchema,
  tenantSimulateRulesSuccessEnvelopeSchema,
  tenantSimulateRulesWireSchema,
  tenantTiersSuccessEnvelopeSchema,
  tenantUpsertTierWireSchema,
  validateRulesSuccessEnvelopeSchema,
  validateRulesWireSchema,
} from "@jubely/api-schemas";
import { z } from "zod";
import type { z as Zod } from "zod";
import {
  buildTenantPath,
  jsonDelete,
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

export async function getRulesHealth(tenantId: string) {
  return tenantFetch(buildTenantPath(tenantId, "rules/health"), rulesHealthSuccessEnvelopeSchema);
}

export async function createRule(
  tenantId: string,
  input: Zod.infer<typeof tenantCreateRuleWireSchema>,
) {
  const payload = tenantCreateRuleWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, "rules"),
    tenantRuleSuccessEnvelopeSchema,
    jsonPost({
      rule: payload.rule,
      priority: payload.priority ?? 0,
      active: payload.active ?? true,
      summary: payload.summary,
    }),
  );
}

export async function patchRule(
  tenantId: string,
  ruleId: string,
  input: Zod.infer<typeof tenantPatchRuleWireSchema>,
) {
  const payload = tenantPatchRuleWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, `rules/${encodeURIComponent(ruleId)}`),
    tenantRuleSuccessEnvelopeSchema,
    jsonPatch(payload),
  );
}

const deleteRuleEnvelopeSchema = successEnvelopeSchema(z.object({ deleted: z.boolean() }));

export async function deleteRule(tenantId: string, ruleId: string) {
  return tenantMutate(
    buildTenantPath(tenantId, `rules/${encodeURIComponent(ruleId)}`),
    deleteRuleEnvelopeSchema,
    jsonDelete(),
  );
}

export async function listRuleVersions(tenantId: string, ruleId: string) {
  const data = await tenantFetch(
    buildTenantPath(tenantId, `rules/${encodeURIComponent(ruleId)}/versions`),
    listRuleVersionsSuccessEnvelopeSchema,
  );
  return data.versions;
}

export async function restoreRuleVersion(tenantId: string, ruleId: string, versionId: string) {
  return tenantMutate(
    buildTenantPath(
      tenantId,
      `rules/${encodeURIComponent(ruleId)}/versions/${encodeURIComponent(versionId)}/restore`,
    ),
    tenantRuleSuccessEnvelopeSchema,
    jsonPost({}),
  );
}

export async function simulateRules(
  tenantId: string,
  input: Zod.infer<typeof tenantSimulateRulesWireSchema>,
) {
  const payload = tenantSimulateRulesWireSchema.parse(input);
  return tenantMutate(
    buildTenantPath(tenantId, "rule-simulations"),
    tenantSimulateRulesSuccessEnvelopeSchema,
    jsonPost(payload),
  );
}

export async function validateRules(
  tenantId: string,
  input?: Zod.infer<typeof validateRulesWireSchema>,
) {
  const payload = input ? validateRulesWireSchema.parse(input) : {};
  return tenantMutate(
    buildTenantPath(tenantId, "rule-validations"),
    validateRulesSuccessEnvelopeSchema,
    jsonPost(payload),
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
  body: Zod.infer<typeof tenantUpsertTierWireSchema>,
) {
  const payload = tenantUpsertTierWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, `tiers/${encodeURIComponent(payload.code)}`),
    tenantTiersSuccessEnvelopeSchema,
    jsonPut(payload),
  );
}
