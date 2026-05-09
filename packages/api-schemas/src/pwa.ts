import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const clientEnrollFormSchema = z
  .object({
    storeQr: z.string().min(1, { message: "required" }),
    phone: z.string().min(1, { message: "required" }),
    name: z.string().min(1, { message: "required" }),
    email: z.string(),
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
});

export const enrollResponseDataSchema = z.object({
  customer_qr: z.string().min(1),
});

export const enrollSuccessEnvelopeSchema = successEnvelopeSchema(enrollResponseDataSchema);
