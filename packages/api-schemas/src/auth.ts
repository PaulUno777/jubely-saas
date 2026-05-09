import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

/** Client-side login form (camelCase). */
export const agentLoginFormSchema = z.object({
  email: z.string().min(1, { message: "required" }).email({ message: "invalid_email" }),
  password: z.string().min(1, { message: "required" }),
  tenantSlug: z.string().optional(),
});

export type AgentLoginForm = z.infer<typeof agentLoginFormSchema>;

/** Wire format for POST /v1/auth/login */
export const loginRequestWireSchema = z.object({
  email: z.string(),
  password: z.string(),
  tenant_slug: z.string(),
});

/** POST /v1/auth/login — discriminated by `step`. */
export const loginOkStepSchema = z.object({
  step: z.literal("ok"),
  access_token: z.string(),
  refresh_token: z.string().optional(),
  user_id: z.string(),
  tenant_id: z.union([z.string(), z.null()]).optional(),
  role: z.string(),
  email: z.string(),
  must_change_password: z.boolean().optional(),
});

export const loginMfaRequiredStepSchema = z.object({
  step: z.literal("mfa_required"),
  challenge_token: z.string(),
  methods: z.array(z.string()),
  user_id: z.string().optional(),
  tenant_id: z.union([z.string(), z.null()]).optional(),
  role: z.string().optional(),
  email: z.string().optional(),
  must_change_password: z.boolean().optional(),
});

export const loginResponseDataSchema = z.discriminatedUnion("step", [loginOkStepSchema, loginMfaRequiredStepSchema]);

export const loginResponseSuccessEnvelopeSchema = successEnvelopeSchema(loginResponseDataSchema);

export type LoginResponseData = z.infer<typeof loginResponseDataSchema>;

/** @deprecated use loginResponseSuccessEnvelopeSchema */
export const loginSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({
    access_token: z.string().min(1),
  }),
);

export type LoginResponseDataOk = z.infer<typeof loginOkStepSchema>;
export type LoginResponseDataMfa = z.infer<typeof loginMfaRequiredStepSchema>;

export const refreshRequestWireSchema = z.object({
  refresh_token: z.string().min(1),
});

export const refreshOkDataSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user_id: z.string(),
  tenant_id: z.union([z.string(), z.null()]).optional(),
  role: z.string(),
  email: z.string(),
  must_change_password: z.boolean().optional(),
});

export const refreshSuccessEnvelopeSchema = successEnvelopeSchema(refreshOkDataSchema);

export type RefreshOkData = z.infer<typeof refreshOkDataSchema>;

export const mfaFactorSchema = z.object({
  id: z.string(),
  type: z.enum(["totp", "passkey"]),
  label: z.string().nullable().optional(),
  enabled_at: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
  last_used_at: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
  created_at: z.union([z.string(), z.date(), z.number()]).optional(),
});

export type MfaFactor = z.infer<typeof mfaFactorSchema>;

export const mfaListSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({
    items: z.array(mfaFactorSchema),
  }),
);

export const totpVerifyRequestWireSchema = z.object({
  challenge_token: z.string(),
  code: z.string(),
});
