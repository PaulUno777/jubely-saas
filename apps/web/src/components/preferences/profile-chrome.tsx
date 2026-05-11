"use client";

import { JubelyLogo, cn } from "@jubely/ui";
import type { AppProfile } from "@/lib/profile";
import { LanguageSelector } from "./language-selector";
import { ThemeSelector } from "./theme-selector";

type ProfileChromeProps = {
  profile: AppProfile;
  className?: string;
};

export function ProfileChrome({ profile, className }: ProfileChromeProps) {
  return (
    <div className={cn("mb-8 flex items-center justify-between gap-4", className)}>
      <JubelyLogo size="sm" />
      <div className="flex items-center gap-2">
        <LanguageSelector profile={profile} />
        <ThemeSelector profile={profile} />
      </div>
    </div>
  );
}
