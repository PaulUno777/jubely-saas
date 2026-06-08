"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenantId } from "@/hooks/useTenantId";
import { getSubscription } from "@/lib/tenant-admin/billing";

export function SubscriptionBanner() {
  const tenantId = useTenantId();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    void getSubscription(tenantId)
      .then((sub) => setStatus(sub.status))
      .catch(() => {});
  }, [tenantId]);

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
