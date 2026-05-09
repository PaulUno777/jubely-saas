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

export const createCustomerSuccessEnvelopeSchema = successEnvelopeSchema(createCustomerResponseDataSchema);

export type CreateCustomerResponseData = z.infer<typeof createCustomerResponseDataSchema>;
