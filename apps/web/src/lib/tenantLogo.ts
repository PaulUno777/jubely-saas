const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export type TenantLogoSource = {
  logo_url?: string | null;
  settings?: unknown;
};

export function tenantLogoUrl(tenant: TenantLogoSource): string | null {
  if (typeof tenant.logo_url === "string" && tenant.logo_url.trim()) {
    return tenant.logo_url.trim();
  }
  if (typeof tenant.settings === "object" && tenant.settings !== null && !Array.isArray(tenant.settings)) {
    const raw = (tenant.settings as Record<string, unknown>).logo_url;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}

export function tenantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function validateTenantLogoFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Choisissez une image (PNG, JPEG, WebP ou SVG).";
  if (file.size > MAX_LOGO_BYTES) return "Image trop lourde (max 2 Mo).";
  return null;
}

export { LOGO_ACCEPT, MAX_LOGO_BYTES };
