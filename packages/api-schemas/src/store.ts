import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const storeMetricsSchema = z.object({
  points_distributed: z.number().nonnegative(),
  point_events_this_month: z.number().nonnegative(),
  clients_served_today: z.number().nonnegative().optional(),
  points_issued_today: z.number().nonnegative().optional(),
  redemptions_today: z.number().nonnegative().optional(),
  new_enrollments_today: z.number().nonnegative().optional(),
});

export const storeMetricsSuccessEnvelopeSchema = successEnvelopeSchema(storeMetricsSchema);

export type StoreMetrics = z.infer<typeof storeMetricsSchema>;

export const patchStoreTenantWireSchema = z.object({
  name: z.string().optional(),
  conflict_policy: z.string().optional(),
  allow_staff_self_enrollment: z.boolean().optional(),
  settings: z.unknown().optional(),
});

export const storeQrDataSchema = z.object({
  store_qr: z.string(),
});

export const storeQrSuccessEnvelopeSchema = successEnvelopeSchema(storeQrDataSchema);

export const storeCustomerSchema = z.object({
  enrollment_id: z.string(),
  customer_id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  tier: z.string(),
  points_balance: z.number(),
  enrolled_at: z.union([z.string(), z.date(), z.number()]),
});

export const listStoreCustomersSuccessEnvelopeSchema = successEnvelopeSchema(
  z.array(storeCustomerSchema),
);

export type StoreCustomer = z.infer<typeof storeCustomerSchema>;

export const storePointEventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  delta: z.number(),
  payload: z.unknown().optional(),
  created_at: z.union([z.string(), z.date(), z.number()]),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
});

export const listStorePointEventsSuccessEnvelopeSchema = successEnvelopeSchema(
  z.array(storePointEventSchema),
);

export type StorePointEvent = z.infer<typeof storePointEventSchema>;
