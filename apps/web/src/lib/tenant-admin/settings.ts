import {
  tenantLocalesSuccessEnvelopeSchema,
  tenantPatchSettingsWireSchema,
  tenantPutLocalesWireSchema,
  tenantSettingsSuccessEnvelopeSchema,
} from "@jubely/api-schemas";
import { buildTenantPath, jsonPatch, jsonPut, tenantFetch, tenantMutate } from "./core";

export async function getSettings(tenantId: string) {
  return tenantFetch(buildTenantPath(tenantId, "settings"), tenantSettingsSuccessEnvelopeSchema);
}

export async function patchSettings(
  tenantId: string,
  body: {
    name?: string;
    conflict_policy?: string;
    allow_staff_self_enrollment?: boolean;
    settings?: unknown;
  },
) {
  const payload = tenantPatchSettingsWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, "settings"),
    tenantSettingsSuccessEnvelopeSchema,
    jsonPatch(payload),
  );
}

export async function getLocales(tenantId: string) {
  const data = await tenantFetch(
    buildTenantPath(tenantId, "settings/locales"),
    tenantLocalesSuccessEnvelopeSchema,
  );
  return data.locales;
}

export async function putLocales(
  tenantId: string,
  locales: { locale: string; is_primary: boolean; enabled: boolean }[],
) {
  const payload = tenantPutLocalesWireSchema.parse({ locales });
  return tenantMutate(
    buildTenantPath(tenantId, "settings/locales"),
    tenantLocalesSuccessEnvelopeSchema,
    jsonPut(payload),
  );
}
