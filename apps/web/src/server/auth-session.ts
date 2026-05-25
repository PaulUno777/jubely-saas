import "server-only";

import { NextResponse } from "next/server";
import {
  AUTH_REFRESH_COOKIE,
  AUTH_SESSION_COOKIE,
  accessTokenCookieMaxAgeSec,
  refreshCookieOptions,
  sessionCookieOptions,
} from "./auth-cookies";
import type { AccessJwtPayload } from "./jwt-payload";
import { upstreamApiOrigin } from "./upstream-api";

export type SessionMeData = {
  user_id: string;
  tenant_id: string | null;
  role: string;
  email: string;
  must_change_password: boolean;
  mfa?: {
    enrolled_factors: number;
    setup_recommended: boolean;
  };
};

export function isAccessTokenUsable(payload: AccessJwtPayload | null): boolean {
  if (!payload?.sub || !payload.role) return false;
  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return true;
}

export function sessionDataFromPayload(payload: AccessJwtPayload): SessionMeData {
  const enrolled =
    typeof payload.mfa_ec === "number" && Number.isFinite(payload.mfa_ec)
      ? Math.max(0, Math.floor(payload.mfa_ec))
      : 0;
  const adminPortal = payload.role === "superadmin" || payload.role === "merchant_admin";
  const mfa =
    adminPortal || enrolled > 0
      ? {
          enrolled_factors: enrolled,
          setup_recommended: adminPortal && enrolled === 0,
        }
      : undefined;

  return {
    user_id: payload.sub!,
    tenant_id: payload.tenant_id ?? null,
    role: payload.role!,
    email: payload.email ?? "",
    must_change_password: Boolean(payload.mcp),
    ...(mfa ? { mfa } : {}),
  };
}

type TokenPair = { access: string; refresh: string };

export async function exchangeRefreshToken(refreshToken: string): Promise<TokenPair | null> {
  const origin = upstreamApiOrigin();
  const upstream = await fetch(`${origin}/v1/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const envelope = (await upstream.json()) as { data?: Record<string, unknown> };
  if (!upstream.ok || !envelope.data) return null;
  const access = typeof envelope.data.access_token === "string" ? envelope.data.access_token : "";
  const refresh =
    typeof envelope.data.refresh_token === "string" ? envelope.data.refresh_token : refreshToken;
  if (!access) return null;
  return { access, refresh };
}

export function setAuthCookiesOnResponse(res: NextResponse, tokens: TokenPair) {
  res.cookies.set(AUTH_SESSION_COOKIE, tokens.access, sessionCookieOptions(accessTokenCookieMaxAgeSec(tokens.access)));
  res.cookies.set(AUTH_REFRESH_COOKIE, tokens.refresh, refreshCookieOptions());
}
