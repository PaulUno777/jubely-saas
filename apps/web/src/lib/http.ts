"use client";

import { parseJsonUnknown, throwFailedApiResponse } from "@jubely/api-schemas";
import { toast } from "sonner";
import { API_BASE_URL } from "./env";
import { clearSession } from "./session";

export function joinUrl(path: string) {
  // If caller already built an absolute URL, don't re-prefix it.
  if (/^https?:\/\//i.test(path)) return path;

  const base = API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  // If NEXT_PUBLIC_API_BASE_URL is already versioned (ex: `http://host:8080/v1`)
  // and `path` also starts with `/v1/...`, avoid `.../v1/v1/...` 404s.
  if (base.endsWith("/v1") && p.startsWith("/v1/")) {
    return `${base.replace(/\/v1$/, "")}${p}`;
  }

  return `${base}${p}`;
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

/** Authenticated fetch with global handling: 401 → clear session + redirect; 403 / 5xx → toast. */
export async function authedFetch(path: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("accept-language")) headers.set("accept-language", acceptLanguage());
  if (!headers.has("authorization")) headers.set("authorization", `Bearer ${accessToken}`);
  // Only set JSON content-type when we know the body is JSON.
  // For `FormData`, the browser must set the multipart boundary itself.
  if (init.body != null && typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const url = joinUrl(path);
  const res = await fetch(url, { ...init, headers });

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

export async function authedJson<T>(path: string, accessToken: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const body = json !== undefined ? JSON.stringify(json) : rest.body;
  const res = await authedFetch(path, accessToken, { ...rest, body });
  const text = await res.text();
  const parsed = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(parsed, res.status, text);
  const envelope = parsed as { data?: T };
  return envelope.data !== undefined ? envelope.data : (parsed as T);
}
