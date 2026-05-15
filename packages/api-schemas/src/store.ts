import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const storeMetricsSchema = z.object({
  points_distributed: z.number().nonnegative(),
  point_events_this_month: z.number().nonnegative(),
});

export const storeMetricsSuccessEnvelopeSchema = successEnvelopeSchema(storeMetricsSchema);

export type StoreMetrics = z.infer<typeof storeMetricsSchema>;

export const patchStoreTenantWireSchema = z.object({
  name: z.string().optional(),
  conflict_policy: z.string().optional(),
  settings: z.unknown().optional(),
});

export const storeQrDataSchema = z.object({
  store_qr: z.string(),
});

export const storeQrSuccessEnvelopeSchema = successEnvelopeSchema(storeQrDataSchema);
