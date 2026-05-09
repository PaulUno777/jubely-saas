import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const tenantSchema = z.object({
  tenant_id: z.string(),
  name: z.string(),
  slug: z.string(),
  self_serve: z.boolean(),
  active: z.boolean(),
  plan: z.string(),
  conflict_policy: z.string().optional(),
  settings: z.unknown(),
  created_at: z.union([z.string(), z.date(), z.number()]).optional(),
  updated_at: z.union([z.string(), z.date(), z.number()]).optional(),
});

export const listTenantsSuccessEnvelopeSchema = successEnvelopeSchema(z.array(tenantSchema));

export const createTenantWireSchema = z.object({
  name: z.string(),
  slug: z.string(),
  self_serve: z.boolean().optional(),
  plan: z.string().optional(),
});

export const createTenantSuccessEnvelopeSchema = successEnvelopeSchema(tenantSchema);

export type Tenant = z.infer<typeof tenantSchema>;

export const userPublicSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  role: z.string(),
  created_at: z.union([z.string(), z.date(), z.number()]).optional(),
});

export const listStoreUsersSuccessEnvelopeSchema = successEnvelopeSchema(z.array(userPublicSchema));

export const createInvitationWireSchema = z.object({
  email: z.string(),
  role: z.string().optional(),
});

export const createInvitationSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({
    invitation_id: z.string(),
    token: z.string(),
    expires_at: z.union([z.string(), z.date(), z.number()]),
  }),
);

export const patchTenantWireSchema = z.object({
  name: z.string().optional(),
  active: z.boolean().optional(),
  plan: z.string().optional(),
  conflict_policy: z.string().optional(),
  settings: z.unknown().optional(),
});

export const singleTenantSuccessEnvelopeSchema = successEnvelopeSchema(tenantSchema);

export const createTenantUserRequestWireSchema = z.object({
  email: z.string(),
  role: z.string().optional(),
  temp_password: z.string().optional().nullable(),
});

export const createTenantUserResponseSchema = z.object({
  user_id: z.string(),
  temp_password: z.string(),
});

export const createTenantUserSuccessEnvelopeSchema = successEnvelopeSchema(createTenantUserResponseSchema);

export const superadminStatsSchema = z.object({
  tenants_total: z.number(),
  tenants_active: z.number(),
  tenants_trial_active: z.number().optional(),
  alerts: z.number(),
});

export const superadminStatsSuccessEnvelopeSchema = successEnvelopeSchema(superadminStatsSchema);

export type SuperadminStats = z.infer<typeof superadminStatsSchema>;

