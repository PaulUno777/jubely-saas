/** API origin for Route Handlers (server). Mirrors apps/web env default. */
export function serverApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082";
  return raw.replace(/\/$/, "");
}
