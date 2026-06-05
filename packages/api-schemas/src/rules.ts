import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const ruleConditionSchema = z.object({
  days: z.array(z.number()),
  hours: z.array(z.number()).nullable().optional(),
  tier: z.string(),
  minAmount: z.number().optional(),
});

export const ruleActionSchema = z.object({
  type: z.enum(["rate", "mult", "flat"]),
  per: z.number().optional(),
  pts: z.number().optional(),
  factor: z.number().optional(),
});

export const loyaltyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string().optional(),
  on: z.boolean(),
  trigger: z.string(),
  cond: ruleConditionSchema,
  action: ruleActionSchema,
});

export const storeRuleRecordSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  priority: z.number(),
  rule: loyaltyRuleSchema,
});

export const listStoreRulesDataSchema = z.object({
  rules: z.array(storeRuleRecordSchema),
});

export const listStoreRulesSuccessEnvelopeSchema = successEnvelopeSchema(listStoreRulesDataSchema);

export const simulateRulesWireSchema = z.object({
  amount_fcfa: z.number(),
  occurred_at: z.string().optional(),
  tier: z.string().optional(),
  is_new: z.boolean().optional(),
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
