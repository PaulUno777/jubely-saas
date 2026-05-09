"use client";

import { useSessionStore } from "@/lib/session";

export function useSession() {
  const session = useSessionStore((s) => s.session);
  return { session };
}

