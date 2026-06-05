import "server-only";

export const AUTH_SESSION_COOKIE = "jubely_session";
export const AUTH_REFRESH_COOKIE = "jubely_refresh";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secureFlag(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

function sameSiteFlag(): "lax" | "strict" | "none" {
  const s = (process.env.AUTH_COOKIE_SAME_SITE ?? "lax").toLowerCase();
  if (s === "strict" || s === "none" || s === "lax") return s;
  return "lax";
}

export function authCookieDomain(): string | undefined {
  const d = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return d || undefined;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: secureFlag(),
    sameSite: sameSiteFlag(),
    path: "/" as const,
    maxAge,
    ...(authCookieDomain() ? { domain: authCookieDomain()! } : {}),
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true as const,
    secure: secureFlag(),
    sameSite: sameSiteFlag(),
    path: "/" as const,
    maxAge: REFRESH_MAX_AGE,
    ...(authCookieDomain() ? { domain: authCookieDomain()! } : {}),
  };
}

export function clearAuthCookieOptions() {
  return {
    httpOnly: true as const,
    secure: secureFlag(),
    sameSite: sameSiteFlag(),
    path: "/" as const,
    maxAge: 0,
    ...(authCookieDomain() ? { domain: authCookieDomain()! } : {}),
  };
}

/** Remaining lifetime in seconds for the access JWT cookie (from `exp` claim). */
export function accessTokenCookieMaxAgeSec(jwt: string): number {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return 3600;
    const seg = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (seg.length % 4)) % 4);
    const json = Buffer.from(seg + pad, "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== "number") return 3600;
    const left = payload.exp - Math.floor(Date.now() / 1000);
    return Math.max(120, Math.min(left, 24 * 3600));
  } catch {
    return 3600;
  }
}
