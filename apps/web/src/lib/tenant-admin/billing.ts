import { z } from "zod";
import { buildTenantPath, jsonPost, tenantFetch, tenantMutate } from "./core";

const subscriptionSchema = z.object({
  plan_code: z.string(),
  status: z.string(),
  billing_period: z.string(),
  trial_ends_at: z.string().optional(),
  current_period_end: z.string().optional(),
  plan: z
    .object({
      name: z.string(),
      max_stores: z.number(),
      price_monthly_fcfa: z.number(),
      price_yearly_fcfa: z.number(),
      features: z.record(z.unknown()).optional(),
    })
    .optional(),
});

const subscriptionEnvelopeSchema = z.object({ data: subscriptionSchema });

const momoInvoiceSchema = z.object({
  id: z.string(),
  pay_reference: z.string(),
  amount_fcfa: z.number(),
  instructions: z.string().optional(),
});

const momoInvoiceEnvelopeSchema = z.object({ data: momoInvoiceSchema });

export type SubscriptionView = z.infer<typeof subscriptionSchema>;

export type MoMoInvoiceView = z.infer<typeof momoInvoiceSchema>;

export async function getSubscription(tenantId: string): Promise<SubscriptionView> {
  return tenantFetch(buildTenantPath(tenantId, "subscription"), subscriptionEnvelopeSchema);
}

export async function createMoMoInvoice(tenantId: string): Promise<MoMoInvoiceView> {
  return tenantMutate(
    buildTenantPath(tenantId, "subscription/invoices"),
    momoInvoiceEnvelopeSchema,
    jsonPost({}),
  );
}
