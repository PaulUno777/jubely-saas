import {
  agentLoginFormSchema,
  loginRequestWireSchema,
  loginResponseSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import type { AgentLoginForm, LoginResponseData } from "@jubely/api-schemas";
import { API_BASE_URL } from "./env";

export { ApiResponseError as ApiError } from "@jubely/api-schemas";

function joinUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  // If NEXT_PUBLIC_API_BASE_URL is already versioned (ex: `http://host:8080/v1`)
  // and `path` also starts with `/v1/...`, avoid `.../v1/v1/...` 404s.
  if (base.endsWith("/v1") && p.startsWith("/v1/")) {
    return `${base.replace(/\/v1$/, "")}${p}`;
  }

  return `${base}${p}`;
}

function acceptLanguage(): string {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en";
}

function jsonHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "content-type": "application/json",
    "accept-language": acceptLanguage(),
    ...extra,
  };
}

export async function login(values: AgentLoginForm): Promise<LoginResponseData> {
  const parsed = agentLoginFormSchema.parse(values);
  const body = loginRequestWireSchema.parse({
    email: parsed.email.trim(),
    password: parsed.password,
    tenant_slug: parsed.tenantSlug?.trim() ?? "",
  });

  const res = await fetch(joinUrl("/v1/auth/login"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, loginResponseSuccessEnvelopeSchema, res.status, text);
}
