import "server-only";

/** Origin of the Go API (server-side only; BFF proxies use this). */
export function upstreamApiOrigin(): string {
  const raw =
    process.env.API_INTERNAL_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:8082";
  return raw.replace(/\/$/, "");
}
