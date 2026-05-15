import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_REFRESH_COOKIE,
  AUTH_SESSION_COOKIE,
  accessTokenCookieMaxAgeSec,
  refreshCookieOptions,
  sessionCookieOptions,
} from "@/server/auth-cookies";
import { upstreamApiOrigin } from "@/server/upstream-api";

type Envelope = { data?: Record<string, unknown>; error?: unknown; meta?: unknown };

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: { code: "auth", message: "no refresh session" } }, { status: 401 });
  }
  const origin = upstreamApiOrigin();
  const upstream = await fetch(`${origin}/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept-language": req.headers.get("accept-language") ?? "en",
    },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const envelope = (await upstream.json()) as Envelope;
  if (!upstream.ok) {
    return NextResponse.json(envelope, { status: upstream.status });
  }
  const data = envelope.data;
  if (!data || typeof data !== "object") {
    return NextResponse.json(envelope, { status: upstream.status });
  }
  const access = typeof data.access_token === "string" ? data.access_token : "";
  const newRefresh = typeof data.refresh_token === "string" ? data.refresh_token : refresh;
  if (!access) {
    return NextResponse.json(envelope, { status: upstream.status });
  }
  const res = NextResponse.json({ data: { ok: true }, meta: envelope.meta }, { status: upstream.status });
  res.cookies.set(AUTH_SESSION_COOKIE, access, sessionCookieOptions(accessTokenCookieMaxAgeSec(access)));
  res.cookies.set(AUTH_REFRESH_COOKIE, newRefresh, refreshCookieOptions());
  return res;
}
