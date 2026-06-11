import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const ruleTriggerSchema = z.enum(["transaction", "enroll", "birthday"]);

export const ruleConditionSchema = z.object({
  days: z.array(z.number()).nullish(),
  hours: z.array(z.number()).nullish(),
  tier: z.string().nullish(),
  minAmount: z.number().optional(),
});

export const ruleActionSchema = z.object({
  type: z.string(),
  per: z.number().optional(),
  pts: z.number().optional(),
  factor: z.number().optional(),
});

export const astConditionSchema = z.object({
  type: z.string(),
  op: z.string().optional(),
  value: z.number().optional(),
  days: z.array(z.number()).optional(),
  from: z.number().optional(),
  to: z.number().optional(),
  tiers: z.array(z.string()).optional(),
  store: z.string().optional(),
});

export const astActionSchema = z.object({
  type: z.string(),
  factor: z.number().optional(),
  pts: z.number().optional(),
  via: z.string().optional(),
  reward: z.string().optional(),
});

export const loyaltyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string().optional(),
  on: z.boolean(),
  trigger: ruleTriggerSchema.or(z.string()),
  cond: ruleConditionSchema.optional(),
  action: ruleActionSchema.optional(),
  schemaVersion: z.number().optional(),
  editorTier: z.enum(["basic", "advanced"]).optional(),
  frozen: z.boolean().optional(),
  frozenReason: z.string().optional(),
  logic: z.enum(["AND", "OR"]).optional(),
  conditions: z.array(astConditionSchema).optional(),
  actions: z.array(astActionSchema).optional(),
});

export const storeRuleRecordSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  priority: z.number(),
  editor_tier: z.string().optional(),
  frozen: z.boolean().optional(),
  frozen_reason: z.string().optional(),
  frozen_at: z.string().optional(),
  current_version_id: z.string().optional(),
  rule: loyaltyRuleSchema,
});

export const listStoreRulesDataSchema = z.object({
  rules: z.array(storeRuleRecordSchema),
});

export const listStoreRulesSuccessEnvelopeSchema = successEnvelopeSchema(listStoreRulesDataSchema);

export const rulesHealthSchema = z.object({
  has_active_base_rule: z.boolean(),
  active_rules_count: z.number(),
  frozen_advanced_count: z.number(),
  program_active: z.boolean(),
});

export const rulesHealthSuccessEnvelopeSchema = successEnvelopeSchema(rulesHealthSchema);

export const simulateRulesWireSchema = z.object({
  amount_fcfa: z.number(),
  occurred_at: z.string().optional(),
  tier: z.string().optional(),
  is_new: z.boolean().optional(),
  fallback_default: z.boolean().optional(),
  draft_rules: z.array(loyaltyRuleSchema).optional(),
});

export const validateRulesWireSchema = z.object({
  draft_rules: z.array(loyaltyRuleSchema).optional(),
  exclude_rule_id: z.string().uuid().optional(),
});

export const ruleTraceEntrySchema = z.object({
  rule_id: z.string(),
  rule_name: z.string(),
  applied: z.boolean(),
  pts: z.string().optional(),
  detail: z.string().optional(),
  reason: z.string().optional(),
});

export const simulateRulesResultSchema = z.object({
  trace: z.array(ruleTraceEntrySchema),
  base: z.number(),
  factor: z.number(),
  bonus: z.number(),
  total: z.number(),
});

export const simulateRulesSuccessEnvelopeSchema = successEnvelopeSchema(simulateRulesResultSchema);

export const ruleVersionSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  version_number: z.number(),
  editor_tier: z.string(),
  created_at: z.string(),
  created_by: z.string().optional(),
  change_summary: z.string().optional(),
  rule: z.unknown(),
});

export const listRuleVersionsDataSchema = z.object({
  versions: z.array(ruleVersionSchema),
});

export const listRuleVersionsSuccessEnvelopeSchema = successEnvelopeSchema(listRuleVersionsDataSchema);
