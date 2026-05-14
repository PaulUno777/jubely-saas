import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const storeMetricsSchema = z.object({
  points_distributed: z.number().nonnegative(),
  point_events_this_month: z.number().nonnegative(),
});

export const storeMetricsSuccessEnvelopeSchema = successEnvelopeSchema(storeMetricsSchema);

export type StoreMetrics = z.infer<typeof storeMetricsSchema>;
