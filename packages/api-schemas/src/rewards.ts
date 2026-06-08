import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const storeRewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  point_cost: z.number(),
  min_tier: z.string(),
  active: z.boolean(),
  stock_limit: z.number().nullable().optional(),
});

export const listStoreRewardsDataSchema = z.object({
  rewards: z.array(storeRewardSchema),
});

export const listStoreRewardsSuccessEnvelopeSchema = successEnvelopeSchema(
  listStoreRewardsDataSchema,
);

export const createStoreRewardWireSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  point_cost: z.number().int().positive(),
  min_tier: z.string().optional(),
  active: z.boolean().optional(),
  stock_limit: z.number().int().positive().nullable().optional(),
});

export const patchStoreRewardWireSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  point_cost: z.number().int().positive().optional(),
  min_tier: z.string().optional(),
  active: z.boolean().optional(),
  stock_limit: z.number().int().positive().nullable().optional(),
});

export const customerRewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  point_cost: z.number(),
  min_tier: z.string(),
  affordable: z.boolean(),
  points_needed: z.number(),
});

export const listCustomerRewardsDataSchema = z.object({
  rewards: z.array(customerRewardSchema),
  points_balance: z.number(),
  tier: z.string(),
});

export const listCustomerRewardsSuccessEnvelopeSchema = successEnvelopeSchema(
  listCustomerRewardsDataSchema,
);

export const claimRewardWireSchema = z.object({
  reward_id: z.string().min(1),
});

export const claimRewardDataSchema = z.object({
  redemption_id: z.string(),
  claim_qr: z.string(),
  display_code: z.string(),
  expires_at: z.union([z.string(), z.date(), z.number()]),
  points_spent: z.number(),
  balance_after: z.number(),
  reward_name: z.string(),
});

export const claimRewardSuccessEnvelopeSchema = successEnvelopeSchema(claimRewardDataSchema);

export const validateRedemptionWireSchema = z.object({
  claim_qr: z.string().min(1),
});

export const validateRedemptionDataSchema = z.object({
  redemption_id: z.string(),
  reward_name: z.string(),
  points_spent: z.number(),
  display_code: z.string(),
  customer_name: z.string(),
  customer_id: z.string(),
});

export const validateRedemptionSuccessEnvelopeSchema = successEnvelopeSchema(
  validateRedemptionDataSchema,
);

export type StoreReward = z.infer<typeof storeRewardSchema>;
export type CustomerReward = z.infer<typeof customerRewardSchema>;
export type ClaimRewardResult = z.infer<typeof claimRewardDataSchema>;
export type ValidateRedemptionResult = z.infer<typeof validateRedemptionDataSchema>;
