import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_REFRESH_COOKIE,
  AUTH_SESSION_COOKIE,
  clearAuthCookieOptions,
} from "@/server/auth-cookies";
import { upstreamApiOrigin } from "@/server/upstream-api";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(AUTH_REFRESH_COOKIE)?.value ?? "";
  const origin = upstreamApiOrigin();
  if (refresh) {
    await fetch(`${origin}/v1/sessions/current`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "accept-language": req.headers.get("accept-language") ?? "en",
      },
      body: JSON.stringify({ refresh_token: refresh }),
    });
  }
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set(AUTH_SESSION_COOKIE, "", clearAuthCookieOptions());
  res.cookies.set(AUTH_REFRESH_COOKIE, "", clearAuthCookieOptions());
  return res;
}
