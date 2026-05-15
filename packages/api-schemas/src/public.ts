import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const publicTenantCardSchema = z.object({
  tenant_id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().optional(),
  store_qr: z.string(),
});

export const publicTenantSuccessEnvelopeSchema = successEnvelopeSchema(publicTenantCardSchema);

export type PublicTenantCard = z.infer<typeof publicTenantCardSchema>;
