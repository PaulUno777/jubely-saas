"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ProfileThemeProvider } from "@/components/preferences/profile-theme-provider";
import { captureInstallPrompt } from "@/lib/pwaInstall";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: false },
        },
      }),
  );

  useEffect(() => {
    captureInstallPrompt();
  }, []);

  return (
    <ProfileThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ProfileThemeProvider>
  );
}
