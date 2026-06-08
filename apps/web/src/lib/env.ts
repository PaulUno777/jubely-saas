/** Go API origin only (no `/api` prefix — that is the Next.js BFF at `/api/v1`). */
export function normalizeApiOrigin(raw: string): string {
  let base = raw.trim().replace(/\/$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -"/api".length);
  }
  return base;
}

export const API_BASE_URL = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082",
);
