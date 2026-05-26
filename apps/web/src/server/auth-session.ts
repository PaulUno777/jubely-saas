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
  membership_id: string | null;
  tenant_id: string | null;
  role: string | null;
  email: string;
  must_change_password: boolean;
  workspaces: Array<{
    membership_id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    role: string;
    permissions: string[];
  }>;
  customer_id: string | null;
  active_enrollment_id: string | null;
  customer_enrollments: Array<{
    enrollment_id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    tier: string;
    points_balance: number;
  }>;
  mfa?: {
    enrolled_factors: number;
    setup_recommended: boolean;
  };
};

export function isAccessTokenUsable(payload: AccessJwtPayload | null): boolean {
  if (!payload?.sub) return false;
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
    membership_id: payload.membership_id ?? null,
    tenant_id: payload.tenant_id ?? null,
    role: payload.role ?? null,
    email: payload.email ?? "",
    must_change_password: Boolean(payload.mcp),
    workspaces: Array.isArray(payload.workspaces)
      ? payload.workspaces
          .filter(
            (workspace): workspace is NonNullable<typeof workspace> =>
              Boolean(workspace?.membership_id && workspace?.tenant_id && workspace?.role),
          )
          .map((workspace) => ({
            membership_id: workspace.membership_id!,
            tenant_id: workspace.tenant_id!,
            tenant_name: workspace.tenant_name ?? "",
            tenant_slug: workspace.tenant_slug ?? "",
            role: workspace.role!,
            permissions: Array.isArray(workspace.permissions) ? workspace.permissions : [],
          }))
      : [],
    customer_id: payload.customer_id ?? null,
    active_enrollment_id: payload.active_enrollment_id ?? null,
    customer_enrollments: Array.isArray(payload.enrollments)
      ? payload.enrollments
          .filter(
            (enrollment): enrollment is NonNullable<typeof enrollment> =>
              Boolean(enrollment?.enrollment_id && enrollment?.tenant_id),
          )
          .map((enrollment) => ({
            enrollment_id: enrollment.enrollment_id!,
            tenant_id: enrollment.tenant_id!,
            tenant_name: enrollment.tenant_name ?? "",
            tenant_slug: enrollment.tenant_slug ?? "",
            tier: enrollment.tier ?? "bronze",
            points_balance:
              typeof enrollment.points_balance === "number" && Number.isFinite(enrollment.points_balance)
                ? enrollment.points_balance
                : 0,
          }))
      : [],
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
