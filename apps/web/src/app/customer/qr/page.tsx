"use client";

import Link from "next/link";
import { Button } from "@jubely/ui";
import { clearCustomerQr, loadCustomerQr } from "@/lib/customerSession";
import { useState } from "react";

export default function CustomerQrPage() {
  const [qr, setQr] = useState<string | null>(() => loadCustomerQr());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">Votre QR</h1>
        <p className="mt-2 text-sm text-muted-foreground">Token QR client (Phase 2: rendu QR graphique).</p>
      </div>

      {!qr ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Aucun QR enregistré.</p>
          <Link className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4" href="/customer/enroll">
            S’inscrire
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <p className="font-mono text-sm break-all">{qr}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(qr);
              }}
              type="button"
            >
              Copier
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearCustomerQr();
                setQr(null);
              }}
              type="button"
            >
              Effacer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

