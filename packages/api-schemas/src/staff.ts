import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const createCustomerFormSchema = z
  .object({
    name: z.string().min(1, { message: "required" }),
    phone: z.string().min(1, { message: "required" }),
    email: z.string(),
  })
  .refine(
    (d) => {
      const e = d.email.trim();
      return e.length === 0 || z.string().email().safeParse(e).success;
    },
    { path: ["email"], message: "invalid_email" },
  );

export type CreateCustomerForm = z.infer<typeof createCustomerFormSchema>;

export const createCustomerWireSchema = z.object({
  name: z.string(),
  phone_e164: z.string(),
  email: z.string().optional(),
});

export const createCustomerResponseDataSchema = z.object({
  customer_id: z.string().min(1),
  enrollment_id: z.string().min(1),
  customer_qr: z.string().min(1),
});

export const createCustomerSuccessEnvelopeSchema = successEnvelopeSchema(
  createCustomerResponseDataSchema,
);

export type CreateCustomerResponseData = z.infer<
  typeof createCustomerResponseDataSchema
>;

export const recordPurchaseFormSchema = z
  .object({
    phone: z.string().optional(),
    customer_qr: z.string().optional(),
    amount_fcfa: z.coerce.number().int().positive({ message: "invalid_amount" }),
  })
  .refine((d) => Boolean(d.phone?.trim() || d.customer_qr?.trim()), {
    message: "required",
    path: ["phone"],
  });

export type RecordPurchaseForm = z.infer<typeof recordPurchaseFormSchema>;

export const recordPurchaseWireSchema = z.object({
  phone_e164: z.string().optional(),
  customer_qr: z.string().optional(),
  amount_fcfa: z.number().int().positive(),
});

export const recordPurchaseResponseDataSchema = z.object({
  points_awarded: z.number().int(),
  delta: z.number().int(),
  enrollment_id: z.string().min(1),
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  tier: z.string().optional(),
  balance_before: z.number().int().optional(),
  balance_after: z.number().int().optional(),
});

export const recordPurchaseSuccessEnvelopeSchema = successEnvelopeSchema(
  recordPurchaseResponseDataSchema,
);

export type RecordPurchaseResponseData = z.infer<
  typeof recordPurchaseResponseDataSchema
>;
