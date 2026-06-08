"use client";

import { usePathname } from "next/navigation";
import { CustomerTabBar } from "@/components/customer/tab-bar";
import "./customer.css";

const HIDE_TABBAR = ["/customer/scan", "/customer/enroll", "/customer/join", "/customer/qr"];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTabBar = HIDE_TABBAR.some((p) => pathname.startsWith(p));

  return (
    <div data-portal="customer" style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }} suppressHydrationWarning>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </div>
      {!hideTabBar && <CustomerTabBar />}
    </div>
  );
}
