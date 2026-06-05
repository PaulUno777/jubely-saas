import { NextResponse, type NextRequest } from "next/server";

/** Must match `AUTH_SESSION_COOKIE` in `server/auth-cookies.ts` (not imported: that module is server-only). */
const SESSION_COOKIE = "jubely_session";

type Role = "superadmin" | "merchant_admin" | "staff" | "customer";
type JwtPayload = {
  role?: Role | null;
  tenant_id?: string;
  workspaces?: Array<{ membership_id?: string; tenant_id?: string; role?: Role }>;
};

function readPayload(accessToken: string): JwtPayload | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;
  try {
    const pad = "=".repeat((4 - (parts[1]!.length % 4)) % 4);
    const base64 = (parts[1]! + pad).replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

function homeForRole(role: Role): string {
  if (role === "superadmin") return "/root";
  if (role === "merchant_admin") return "/store";
  if (role === "staff") return "/agent";
  return "/customer";
}

function requiredRoleForPath(pathname: string): Role | null {
  if (pathname.startsWith("/root")) return "superadmin";
  if (pathname.startsWith("/store")) return "merchant_admin";
  if (pathname.startsWith("/agent")) return "staff";
  if (pathname.startsWith("/account")) return null; // checked below (superadmin | merchant_admin only)
  return null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  const isProtected =
    pathname.startsWith("/root") ||
    pathname.startsWith("/store") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/account");
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = readPayload(token);
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  const role = payload.role ?? null;
  const hasWorkspaceSelectionPending =
    !payload.tenant_id && Array.isArray(payload.workspaces) && payload.workspaces.length > 1;

  const required = requiredRoleForPath(pathname);
  if ((pathname.startsWith("/store") || pathname.startsWith("/agent")) && hasWorkspaceSelectionPending) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("workspace", "1");
    return NextResponse.redirect(url);
  }

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (required && role !== required) {
    const url = req.nextUrl.clone();
    url.pathname = homeForRole(role);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/account") && role !== "superadmin" && role !== "merchant_admin") {
    const url = req.nextUrl.clone();
    url.pathname = homeForRole(role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/root/:path*", "/store/:path*", "/agent/:path*", "/account/:path*"],
};
