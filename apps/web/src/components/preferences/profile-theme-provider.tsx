"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { detectProfile, themeConfigForPath } from "@/lib/profile";

function ProfileThemeBridge({ profile }: { profile: ReturnType<typeof detectProfile> }) {
  useEffect(() => {
    const root = document.documentElement;
    if (profile) {
      root.dataset.profile = profile;
    } else {
      delete root.dataset.profile;
    }
  }, [profile]);

  return null;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return <Toaster richColors theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}

export function ProfileThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = detectProfile(pathname);
  const config = themeConfigForPath(pathname);

  return (
    <ThemeProvider
      key={config.storageKey}
      attribute="class"
      defaultTheme={config.defaultTheme}
      enableSystem={config.enableSystem}
      storageKey={config.storageKey}
      disableTransitionOnChange
    >
      <ProfileThemeBridge profile={profile} />
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
