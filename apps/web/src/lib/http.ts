"use client";

import { parseJsonUnknown, throwFailedApiResponse } from "@jubely/api-schemas";
import { toast } from "sonner";
import { API_BASE_URL } from "./env";
import { clearSession, tryRefreshAccessToken } from "./session";

export function joinUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && p.startsWith("/v1/")) {
    return `/api${p}`;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
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
