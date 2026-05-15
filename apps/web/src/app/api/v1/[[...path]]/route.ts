import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/server/auth-cookies";
import { upstreamApiOrigin } from "@/server/upstream-api";

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(req: NextRequest, segments: string[], method: string) {
  if (segments.length === 0) {
    return NextResponse.json({ error: { code: "validation", message: "missing path" } }, { status: 404 });
  }
  const origin = upstreamApiOrigin();
  const target = new URL(`${origin}/v1/${segments.join("/")}`);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (hopByHop.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  const token = req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(target.toString(), {
    method,
    headers,
    ...(body && body.byteLength > 0 ? { body } : {}),
  });

  const outHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === "transfer-encoding") return;
    outHeaders.set(k, v);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? [], "GET");
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? [], "POST");
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? [], "PATCH");
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? [], "PUT");
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? [], "DELETE");
}
