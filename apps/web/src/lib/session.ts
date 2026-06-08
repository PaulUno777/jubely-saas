"use client";

import { create } from "zustand";

export type Role = "superadmin" | "merchant_admin" | "staff" | "customer";
export type WorkspaceSummary = {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: Role;
  permissions: string[];
};

export type CustomerEnrollmentSummary = {
  enrollmentId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tier: string;
  pointsBalance: number;
};

export type MfaSummary = {
  required?: boolean;
  enrolled_factors?: number;
  setup_recommended?: boolean;
  methods?: string[];
};

export type Session = {
  role?: Role;
  tenantId?: string;
  membershipId?: string;
  activeStoreId?: string;
  email?: string;
  mustChangePassword?: boolean;
  userId?: string;
  customerId?: string;
  activeEnrollmentId?: string;
  workspaces: WorkspaceSummary[];
  customerEnrollments: CustomerEnrollmentSummary[];
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
  membership_id?: string | null;
  tenant_id?: string | null;
  active_store_id?: string | null;
  role?: string | null;
  email?: string;
  must_change_password?: boolean;
  customer_id?: string | null;
  active_enrollment_id?: string | null;
  workspaces?: Array<{
    membership_id: string;
    tenant_id: string;
    tenant_name?: string;
    tenant_slug?: string;
    role: string;
    permissions?: string[];
  }>;
  customer_enrollments?: Array<{
    enrollment_id: string;
    tenant_id: string;
    tenant_name?: string;
    tenant_slug?: string;
    tier?: string;
    points_balance?: number;
  }>;
  mfa?: MfaSummary;
}) {
  useSessionStore.getState().setSession({
    role: data.role ? (data.role as Role) : undefined,
    tenantId: data.tenant_id ?? undefined,
    membershipId: data.membership_id ?? undefined,
    activeStoreId: data.active_store_id ?? undefined,
    email: data.email,
    mustChangePassword: Boolean(data.must_change_password),
    userId: data.user_id,
    customerId: data.customer_id ?? undefined,
    activeEnrollmentId: data.active_enrollment_id ?? undefined,
    workspaces: Array.isArray(data.workspaces)
      ? data.workspaces.map((workspace) => ({
          membershipId: workspace.membership_id,
          tenantId: workspace.tenant_id,
          tenantName: workspace.tenant_name ?? "",
          tenantSlug: workspace.tenant_slug ?? "",
          role: workspace.role as Role,
          permissions: Array.isArray(workspace.permissions) ? workspace.permissions : [],
        }))
      : [],
    customerEnrollments: Array.isArray(data.customer_enrollments)
      ? data.customer_enrollments.map((enrollment) => ({
          enrollmentId: enrollment.enrollment_id,
          tenantId: enrollment.tenant_id,
          tenantName: enrollment.tenant_name ?? "",
          tenantSlug: enrollment.tenant_slug ?? "",
          tier: enrollment.tier ?? "bronze",
          pointsBalance: enrollment.points_balance ?? 0,
        }))
      : [],
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
        membership_id?: string | null;
        tenant_id?: string | null;
        active_store_id?: string | null;
        role?: string | null;
        email?: string;
        must_change_password?: boolean;
        customer_id?: string | null;
        active_enrollment_id?: string | null;
        workspaces?: Array<{
          membership_id: string;
          tenant_id: string;
          tenant_name?: string;
          tenant_slug?: string;
          role: string;
          permissions?: string[];
        }>;
        customer_enrollments?: Array<{
          enrollment_id: string;
          tenant_id: string;
          tenant_name?: string;
          tenant_slug?: string;
          tier?: string;
          points_balance?: number;
        }>;
        mfa?: MfaSummary;
      } | null;
    };
    const d = json.data;
    if (!d?.user_id) return false;
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
