import "server-only";

export type AccessJwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  tenant_id?: string;
  mcp?: boolean;
  mfa_ec?: number;
  exp?: number;
};

export function decodeJwtPayload(jwt: string): AccessJwtPayload | null {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const seg = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (seg.length % 4)) % 4);
    const json = Buffer.from(seg + pad, "base64").toString("utf8");
    return JSON.parse(json) as AccessJwtPayload;
  } catch {
    return null;
  }
}
