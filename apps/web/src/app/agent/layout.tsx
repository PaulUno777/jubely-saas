"use client";

import { usePathname } from "next/navigation";
import { AgentTabBar } from "@/components/agent/tab-bar";
import "./agent.css";

const HIDE_TABBAR = ["/agent/scanner", "/agent/customers/new"];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTabBar = HIDE_TABBAR.some((p) => pathname.startsWith(p));

  return (
    <div
      data-portal="agent"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100svh",
      }}
      suppressHydrationWarning
    >
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </div>
      {!hideTabBar && <AgentTabBar />}
    </div>
  );
}
