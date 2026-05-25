"use client";

import { create } from "zustand";

export type Role = "superadmin" | "merchant_admin" | "staff" | "customer";

export type MfaSummary = {
  required?: boolean;
  enrolled_factors?: number;
  setup_recommended?: boolean;
  methods?: string[];
};

export type Session = {
  role: Role;
  tenantId?: string;
  email?: string;
  mustChangePassword?: boolean;
  userId?: string;
  mfa?: MfaSummary;
};

type SessionState = {
  session: Session | null;
  setSession: (s: Session) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clear: () => set({ session: null }),
}));

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  return useSessionStore.getState().session;
}

export function applyAuthSession(data: {
  user_id: string;
  tenant_id?: string | null;
  role: string;
  email?: string;
  must_change_password?: boolean;
  mfa?: MfaSummary;
}) {
  useSessionStore.getState().setSession({
    role: data.role as Role,
    tenantId: data.tenant_id ?? undefined,
    email: data.email,
    mustChangePassword: Boolean(data.must_change_password),
    userId: data.user_id,
    mfa: data.mfa,
  });
}

/** Hydrate client session from HttpOnly cookies via BFF (`/api/auth/me` returns `data: null` when logged out). */
export async function bootstrapAuthFromServer(): Promise<boolean> {
  try {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok) return false;
    const json = (await r.json()) as {
      data?: {
        user_id: string;
        tenant_id?: string | null;
        role: string;
        email?: string;
        must_change_password?: boolean;
        mfa?: MfaSummary;
      } | null;
    };
    const d = json.data;
    if (!d?.user_id || !d.role) return false;
    applyAuthSession(d);
    return true;
  } catch {
    return false;
  }
}

export async function tryRefreshAccessToken(): Promise<boolean> {
  const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (!r.ok) return false;
  const json = (await r.json()) as { data?: { ok?: boolean } | null };
  if (!json.data) return false;
  return bootstrapAuthFromServer();
}

export function clearSession() {
  useSessionStore.getState().clear();
  void fetch("/api/auth/logout", { method: "POST", credentials: "include", keepalive: true });
}
