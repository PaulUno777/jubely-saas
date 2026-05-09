"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { captureInstallPrompt } from "@/lib/pwaInstall";
import { Toaster } from "sonner";

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
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors theme="dark" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}


