import { normalizeApiOrigin } from "./env";

/** API origin for Route Handlers (server). Mirrors apps/web env default. */
export function serverApiBaseUrl(): string {
  return normalizeApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082");
}
