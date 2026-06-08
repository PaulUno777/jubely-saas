import {
  tenantCampaignSuccessEnvelopeSchema,
  tenantCampaignsSuccessEnvelopeSchema,
  tenantCampaignWireSchema,
} from "@jubely/api-schemas";
import type { z } from "zod";
import { buildTenantPath, jsonPatch, jsonPost, tenantFetch, tenantMutate } from "./core";

export async function listCampaigns(tenantId: string) {
  const data = await tenantFetch(
    buildTenantPath(tenantId, "campaigns"),
    tenantCampaignsSuccessEnvelopeSchema,
  );
  return data.campaigns;
}

export async function getCampaign(tenantId: string, campaignId: string) {
  return tenantFetch(
    buildTenantPath(tenantId, `campaigns/${encodeURIComponent(campaignId)}`),
    tenantCampaignSuccessEnvelopeSchema,
  );
}

export async function createCampaign(
  tenantId: string,
  body: z.infer<typeof tenantCampaignWireSchema>,
) {
  const payload = tenantCampaignWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, "campaigns"),
    tenantCampaignSuccessEnvelopeSchema,
    jsonPost(payload),
  );
}

export async function updateCampaign(
  tenantId: string,
  campaignId: string,
  body: z.infer<typeof tenantCampaignWireSchema>,
) {
  const payload = tenantCampaignWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, `campaigns/${encodeURIComponent(campaignId)}`),
    tenantCampaignSuccessEnvelopeSchema,
    jsonPatch(payload),
  );
}

export async function launchCampaign(tenantId: string, campaignId: string) {
  return tenantMutate(
    buildTenantPath(tenantId, `campaigns/${encodeURIComponent(campaignId)}`),
    tenantCampaignSuccessEnvelopeSchema,
    jsonPatch({ status: "active" }),
  );
}

export async function pauseCampaign(tenantId: string, campaignId: string) {
  return tenantMutate(
    buildTenantPath(tenantId, `campaigns/${encodeURIComponent(campaignId)}`),
    tenantCampaignSuccessEnvelopeSchema,
    jsonPatch({ status: "paused" }),
  );
}
