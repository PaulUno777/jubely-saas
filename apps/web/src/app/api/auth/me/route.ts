import { NextResponse, type NextRequest } from "next/server";
import { AUTH_REFRESH_COOKIE, AUTH_SESSION_COOKIE } from "@/server/auth-cookies";
import {
  decodeJwtPayload,
} from "@/server/jwt-payload";
import {
  exchangeRefreshToken,
  isAccessTokenUsable,
  sessionDataFromPayload,
  setAuthCookiesOnResponse,
} from "@/server/auth-session";

/** Returns current session from HttpOnly cookies. `data: null` when logged out (always 200). */
export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  let payload = accessToken ? decodeJwtPayload(accessToken) : null;

  if (!isAccessTokenUsable(payload)) {
    const refreshToken = req.cookies.get(AUTH_REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const tokens = await exchangeRefreshToken(refreshToken);
      if (tokens) {
        payload = decodeJwtPayload(tokens.access);
        if (isAccessTokenUsable(payload)) {
          const res = NextResponse.json({ data: sessionDataFromPayload(payload!) });
          setAuthCookiesOnResponse(res, tokens);
          return res;
        }
      }
    }
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: sessionDataFromPayload(payload!) });
}
