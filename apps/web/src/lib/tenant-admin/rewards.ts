import {
  tenantCreateRewardWireSchema,
  tenantPatchRewardWireSchema,
  tenantRewardSuccessEnvelopeSchema,
  tenantRewardsSuccessEnvelopeSchema,
} from "@jubely/api-schemas";
import { joinUrlWithQuery } from "@/lib/http";
import {
  buildTenantPath,
  jsonPatch,
  jsonPost,
  tenantFetch,
  tenantMutate,
} from "./core";

export async function listRewards(tenantId: string, activeOnly = true) {
  const path = joinUrlWithQuery(buildTenantPath(tenantId, "rewards"), {
    ...(activeOnly ? {} : { active_only: "false" }),
  });
  const data = await tenantFetch(path, tenantRewardsSuccessEnvelopeSchema);
  return data.rewards;
}

export async function createReward(
  tenantId: string,
  body: {
    name: string;
    description?: string;
    point_cost: number;
    min_tier?: string;
    active?: boolean;
    stock_limit?: number | null;
  },
) {
  const payload = tenantCreateRewardWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, "rewards"),
    tenantRewardSuccessEnvelopeSchema,
    jsonPost({ ...payload, active: payload.active ?? true }),
  );
}

export async function patchReward(
  tenantId: string,
  rewardId: string,
  body: {
    name?: string;
    description?: string;
    point_cost?: number;
    min_tier?: string;
    active?: boolean;
    stock_limit?: number | null;
  },
) {
  const payload = tenantPatchRewardWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, `rewards/${encodeURIComponent(rewardId)}`),
    tenantRewardSuccessEnvelopeSchema,
    jsonPatch(payload),
  );
}

export async function uploadRewardImage(tenantId: string, rewardId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return tenantMutate(
    buildTenantPath(tenantId, `rewards/${encodeURIComponent(rewardId)}/image`),
    tenantRewardSuccessEnvelopeSchema,
    { method: "PUT", body: form },
  );
}
