"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authedJson } from "@/lib/http";

export function SubscriptionBanner() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void authedJson<{ status: string }>("/v1/organizations/me/subscription")
      .then((sub) => setStatus(sub.status))
      .catch(() => {});
  }, []);

  if (!status || status === "active" || status === "trialing") return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <p className="font-medium">Abonnement Jubelee — {status}</p>
      <p className="text-muted-foreground">
        Les opérations d&apos;écriture sont suspendues sur toutes les boutiques. Renouvelez pour réactiver.
      </p>
      <Link href="/store/subscription" className="mt-2 inline-block underline">
        Gérer l&apos;abonnement
      </Link>
    </div>
  );
}
