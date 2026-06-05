export type AppProfile = "admin" | "agent" | "customer" | "merchant";

export type ProfileThemeConfig = {
  defaultTheme: "light" | "dark" | "system";
  enableSystem: boolean;
  storageKey: string;
};

export const profileThemeConfig: Record<AppProfile, ProfileThemeConfig> = {
  admin: {
    defaultTheme: "dark",
    enableSystem: false,
    storageKey: "jubely-theme-admin",
  },
  agent: {
    defaultTheme: "light",
    enableSystem: true,
    storageKey: "jubely-theme-agent",
  },
  merchant: {
    defaultTheme: "system",
    enableSystem: true,
    storageKey: "jubely-theme-merchant",
  },
  customer: {
    defaultTheme: "light",
    enableSystem: true,
    storageKey: "jubely-theme-customer",
  },
};

export const publicThemeConfig: ProfileThemeConfig = {
  defaultTheme: "light",
  enableSystem: true,
  storageKey: "jubely-theme-public",
};

export function detectProfile(pathname: string): AppProfile | null {
  if (pathname.startsWith("/root")) return "admin";
  if (pathname.startsWith("/store")) return "merchant";
  if (pathname.startsWith("/agent")) return "agent";
  if (pathname.startsWith("/customer")) return "customer";
  return null;
}

export function themeConfigForPath(pathname: string): ProfileThemeConfig {
  const profile = detectProfile(pathname);
  return profile ? profileThemeConfig[profile] : publicThemeConfig;
}

export function preferencesProfile(profile: AppProfile | null): AppProfile {
  return profile ?? "agent";
}
