"use client";

import type { ReactNode } from "react";
import { PortalSearchProvider } from "@/components/layout/portal-search-provider";
import { StoreCommandMenu } from "@/components/layout/store-command-menu";

export function StorePortalProviders({ children }: { children: ReactNode }) {
  return (
    <PortalSearchProvider>
      {children}
      <StoreCommandMenu />
    </PortalSearchProvider>
  );
}
