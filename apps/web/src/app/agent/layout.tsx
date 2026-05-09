"use client";

import { InstallBanner } from "@/components/InstallBanner";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <InstallBanner />
      {children}
    </div>
  );
}

