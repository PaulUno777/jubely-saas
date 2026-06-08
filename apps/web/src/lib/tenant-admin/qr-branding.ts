import {
  qrBrandingSuccessEnvelopeSchema,
  tenantQrTokenSuccessEnvelopeSchema,
} from "@jubely/api-schemas";
import { joinUrl } from "@/lib/http";
import { buildTenantPath, jsonPut, tenantFetch, tenantMutate } from "./core";

export async function getQRBranding(tenantId: string) {
  return tenantFetch(buildTenantPath(tenantId, "qr/branding"), qrBrandingSuccessEnvelopeSchema);
}

export async function putQRBranding(
  tenantId: string,
  body: {
    variant?: string;
    theme?: string;
    accent_color?: string;
    font_family?: string;
    heading_font?: string | null;
    qr_foreground?: string | null;
    qr_background?: string | null;
    layout_json?: unknown;
    section_toggles?: unknown;
    copy?: Record<string, Record<string, string>>;
  },
) {
  return tenantMutate(
    buildTenantPath(tenantId, "qr/branding"),
    qrBrandingSuccessEnvelopeSchema,
    jsonPut(body),
  );
}

export async function getQRToken(tenantId: string) {
  return tenantFetch(buildTenantPath(tenantId, "enrollment-qr"), tenantQrTokenSuccessEnvelopeSchema);
}

export function qrRenderSvgUrl(tenantId: string): string {
  return joinUrl(buildTenantPath(tenantId, "enrollment-qr/render"));
}
