"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "superadmin" | "merchant_admin" | "staff" | "customer";

export type Session = {
  accessToken: string;
  role: Role;
  tenantId?: string;
  email?: string;
  /** From JWT claim `mcp` (must change password). */
  mustChangePassword?: boolean;
};

const storageKey = "jubely_web_session_v1";
const cookieKey = "jubely_session";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function base64UrlDecode(input: string): string {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(base64);
  try {
    return decodeURIComponent(
      Array.from(str)
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
  } catch {
    return str;
  }
}

export function decodeSessionFromJWT(accessToken: string): Session | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]!)) as {
      role?: string;
      tenant_id?: string;
      email?: string;
      mcp?: boolean;
    };
    const role = payload.role as Role | undefined;
    if (!role) return null;
    return {
      accessToken,
      role,
      tenantId: payload.tenant_id,
      email: payload.email,
      mustChangePassword: Boolean(payload.mcp),
    };
  } catch {
    return null;
  }
}

type SessionState = {
  accessToken: string | null;
  session: Session | null;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      session: null,
      setAccessToken: (accessToken) => {
        const session = decodeSessionFromJWT(accessToken);
        set({ accessToken, session });
        // Cookie is used only for Next middleware route gating (not as a secure session store).
        setCookie(cookieKey, accessToken, 60 * 60 * 24);
      },
      clear: () => {
        set({ accessToken: null, session: null });
        clearCookie(cookieKey);
      },
    }),
    {
      name: storageKey,
      partialize: (s) => ({ accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        const token = state?.accessToken;
        if (token) state?.setAccessToken(token);
      },
    },
  ),
);

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  return useSessionStore.getState().session;
}

export function saveSession(accessToken: string) {
  useSessionStore.getState().setAccessToken(accessToken);
}

export function clearSession() {
  useSessionStore.getState().clear();
}

