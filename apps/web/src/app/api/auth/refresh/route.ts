import { NextResponse, type NextRequest } from "next/server";
import { AUTH_REFRESH_COOKIE } from "@/server/auth-cookies";
import { exchangeRefreshToken, setAuthCookiesOnResponse } from "@/server/auth-session";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ data: null });
  }
  const tokens = await exchangeRefreshToken(refresh);
  if (!tokens) {
    return NextResponse.json({ error: { code: "auth", message: "refresh failed" } }, { status: 401 });
  }
  const res = NextResponse.json({ data: { ok: true } });
  setAuthCookiesOnResponse(res, tokens);
  return res;
}
