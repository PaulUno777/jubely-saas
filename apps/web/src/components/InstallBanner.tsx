"use client";

import { Button } from "@jubely/ui";
import { useEffect, useState } from "react";
import { isInstallAvailable, promptInstall } from "@/lib/pwaInstall";

export function InstallBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setAvailable(isInstallAvailable()), 500);
    return () => window.clearInterval(id);
  }, []);

  if (!available) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium">Installer Jubely</p>
        <p className="text-xs text-muted-foreground">Ajoutez l’app à l’écran d’accueil (PWA). Mobile app plus tard.</p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await promptInstall();
          setAvailable(isInstallAvailable());
        }}
        type="button"
      >
        Installer
      </Button>
    </div>
  );
}

