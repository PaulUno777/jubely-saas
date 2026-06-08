"use client";

import { parseJsonUnknown, throwFailedApiResponse } from "@jubely/api-schemas";
import { toast } from "sonner";
import { API_BASE_URL } from "./env";
import { clearSession, tryRefreshAccessToken } from "./session";

/** Normalize `/api/v1/...` → `/v1/...` for path joining. */
function toV1Path(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/api/v1/")) return p.slice("/api".length);
  if (p.startsWith("/api/auth/")) return p;
  return p;
}

/**
 * Resolve an API path for fetch.
 * - Browser: same-origin Next BFF (`/api/v1/...`, `/api/auth/...`) so HttpOnly cookies work.
 * - Server (SSR): direct Go origin (`http://host:8082/v1/...`) — never `/api/v1` on the backend.
 */
export function joinUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const p = toV1Path(path);

  if (typeof window !== "undefined") {
    if (p.startsWith("/v1/")) return `/api${p}`;
    if (p.startsWith("/api/auth/")) return p;
    return p;
  }

  const base = API_BASE_URL;
  if (base.endsWith("/v1") && p.startsWith("/v1/")) {
    return `${base.replace(/\/v1$/, "")}${p}`;
  }
  return `${base}${p}`;
}

/** Append query params to an API path (avoids `new URL(relative)` which throws in the browser). */
export function joinUrlWithQuery(
  path: string,
  params: Record<string, string | number | undefined> = {},
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) sp.set(key, String(value));
  }
  const qs = sp.toString();
  const base = joinUrl(path);
  return qs ? `${base}?${qs}` : base;
}

export function acceptLanguage(): string {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en";
}

export function jsonHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "content-type": "application/json",
    "accept-language": acceptLanguage(),
    ...extra,
  };
}

/** Authenticated fetch via same-origin proxy; sends HttpOnly session cookie. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("accept-language")) headers.set("accept-language", acceptLanguage());
  if (init.body != null && typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const url = joinUrl(path);
  let res = await fetch(url, { ...init, headers, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      res = await fetch(url, { ...init, headers, credentials: "include" });
    }
  }

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.assign("/login");
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    toast.error("Accès refusé");
  } else if (res.status >= 500) {
    toast.error("Erreur serveur");
  }

  return res;
}

export async function authedJson<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const body = json !== undefined ? JSON.stringify(json) : rest.body;
  const res = await authedFetch(path, { ...rest, body });
  const text = await res.text();
  const parsed = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(parsed, res.status, text);
  const envelope = parsed as { data?: T };
  return envelope.data !== undefined ? envelope.data : (parsed as T);
}
