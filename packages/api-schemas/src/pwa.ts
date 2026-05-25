import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const clientEnrollFormSchema = z
  .object({
    storeQr: z.string().min(1, { message: "required" }),
    phone: z.string().min(1, { message: "required" }),
    name: z.string().min(1, { message: "required" }),
    email: z.string(),
    phoneVerifyToken: z.string().optional(),
  })
  .refine(
    (d) => {
      const e = d.email.trim();
      return e.length === 0 || z.string().email().safeParse(e).success;
    },
    { path: ["email"], message: "invalid_email" },
  );

export type ClientEnrollForm = z.infer<typeof clientEnrollFormSchema>;

export const enrollByStoreQrWireSchema = z.object({
  store_qr: z.string(),
  phone_e164: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone_verify_token: z.string().optional(),
});

export const enrollResponseDataSchema = z.object({
  tenant_id: z.string().optional(),
  customer_id: z.string().optional(),
  enrollment_id: z.string().optional(),
  customer_qr: z.string().min(1),
});

export const enrollSuccessEnvelopeSchema = successEnvelopeSchema(enrollResponseDataSchema);

export const pwaWalletEventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  delta: z.number(),
  payload: z.unknown().optional(),
  created_at: z.union([z.string(), z.date(), z.number()]),
});

export const pwaWalletSchema = z.object({
  tenant_id: z.string(),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  customer_id: z.string(),
  enrollment_id: z.string(),
  tier: z.string(),
  points_balance: z.number(),
  recent_events: z.array(pwaWalletEventSchema),
});

export const pwaWalletSuccessEnvelopeSchema = successEnvelopeSchema(pwaWalletSchema);

export type PwaWallet = z.infer<typeof pwaWalletSchema>;
