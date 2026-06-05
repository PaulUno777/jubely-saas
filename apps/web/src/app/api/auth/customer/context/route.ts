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

function stripTokens(data: Record<string, unknown>) {
  const rest = { ...data };
  delete rest.access_token;
  delete rest.refresh_token;
  return rest;
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!session) {
    return NextResponse.json({ error: { code: "auth", message: "missing session" } }, { status: 401 });
  }
  const origin = upstreamApiOrigin();
  const bodyText = await req.text();
  const upstream = await fetch(`${origin}/v1/auth/customer/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept-language": req.headers.get("accept-language") ?? "en",
      authorization: `Bearer ${session}`,
    },
    body: bodyText || "{}",
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
  const refresh = typeof data.refresh_token === "string" ? data.refresh_token : "";
  if (!access) {
    return NextResponse.json(envelope, { status: upstream.status });
  }
  const res = NextResponse.json({ data: stripTokens(data), meta: envelope.meta }, { status: upstream.status });
  res.cookies.set(AUTH_SESSION_COOKIE, access, sessionCookieOptions(accessTokenCookieMaxAgeSec(access)));
  if (refresh) {
    res.cookies.set(AUTH_REFRESH_COOKIE, refresh, refreshCookieOptions());
  }
  return res;
}
