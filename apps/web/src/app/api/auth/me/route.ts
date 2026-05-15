import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/server/auth-cookies";
import { decodeJwtPayload } from "@/server/jwt-payload";

export async function GET(_req: NextRequest) {
  const token = _req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: { code: "auth", message: "unauthorized" } }, { status: 401 });
  }
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.role) {
    return NextResponse.json({ error: { code: "auth", message: "invalid session" } }, { status: 401 });
  }

  const enrolled = typeof payload.mfa_ec === "number" && Number.isFinite(payload.mfa_ec) ? Math.max(0, Math.floor(payload.mfa_ec)) : 0;
  const adminPortal = payload.role === "superadmin" || payload.role === "merchant_admin";
  const mfa =
    adminPortal || enrolled > 0
      ? {
          enrolled_factors: enrolled,
          setup_recommended: adminPortal && enrolled === 0,
        }
      : undefined;

  return NextResponse.json({
    data: {
      user_id: payload.sub,
      tenant_id: payload.tenant_id ?? null,
      role: payload.role,
      email: payload.email ?? "",
      must_change_password: Boolean(payload.mcp),
      ...(mfa ? { mfa } : {}),
    },
  });
}
