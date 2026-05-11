"use client";

import { InstallBanner } from "@/components/InstallBanner";
import { ProfileChrome } from "@/components/preferences/profile-chrome";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <ProfileChrome profile="agent" />
      <InstallBanner />
      {children}
    </div>
  );
}

