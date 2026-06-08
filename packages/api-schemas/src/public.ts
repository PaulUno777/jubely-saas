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

export const invitationPreviewValidSchema = z.object({
  valid: z.literal(true),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  email_masked: z.string(),
  expires_at: z.union([z.string(), z.number()]),
  role: z.string(),
});

export const invitationPreviewInvalidSchema = z.object({
  valid: z.literal(false),
  code: z.string(),
});

export const invitationPreviewSchema = z.union([
  invitationPreviewValidSchema,
  invitationPreviewInvalidSchema,
]);

export const invitationPreviewSuccessEnvelopeSchema = successEnvelopeSchema(invitationPreviewSchema);

export const acceptInvitationWireSchema = z.object({
  status: z.literal("accepted"),
  password: z.string().min(8),
});

export const acceptInvitationSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({
    user_id: z.string(),
    tenant_id: z.string(),
  }),
);

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
