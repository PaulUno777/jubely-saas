"use client";

import { useEffect, useState } from "react";
import { authedJson } from "@/lib/http";
import { SubscriptionBanner } from "@/components/store/subscription-banner";

type SubscriptionView = {
  plan_code: string;
  status: string;
  billing_period: string;
  trial_ends_at?: string;
  current_period_end?: string;
  plan?: {
    name: string;
    max_stores: number;
    price_monthly_fcfa: number;
    price_yearly_fcfa: number;
  };
};

export default function StoreSubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionView | null>(null);
  const [invoice, setInvoice] = useState<{ pay_reference?: string; amount_fcfa?: number; instructions?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void authedJson<SubscriptionView>("/v1/organizations/me/subscription")
      .then(setSub)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function requestMoMo() {
    setError(null);
    try {
      const inv = await authedJson<{ pay_reference: string; amount_fcfa: number; instructions: string }>(
        "/v1/organizations/me/subscription/momo-invoice",
        { method: "POST" },
      );
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Abonnement Jubelee</h1>
      <SubscriptionBanner />
      {error && <p className="text-destructive text-sm">{error}</p>}
      {sub && (
        <div className="rounded-lg border p-4 space-y-2">
          <p>
            <span className="text-muted-foreground">Forfait</span> {sub.plan?.name ?? sub.plan_code}
          </p>
          <p>
            <span className="text-muted-foreground">Statut</span> {sub.status}
          </p>
          {sub.trial_ends_at && (
            <p>
              <span className="text-muted-foreground">Fin d&apos;essai</span>{" "}
              {new Date(sub.trial_ends_at).toLocaleDateString("fr-FR")}
            </p>
          )}
          {sub.plan && (
            <p className="text-sm text-muted-foreground">
              {sub.plan.price_monthly_fcfa.toLocaleString("fr-FR")} FCFA / mois · jusqu&apos;à {sub.plan.max_stores}{" "}
              boutique(s)
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        onClick={() => void requestMoMo()}
      >
        Obtenir une référence Mobile Money
      </button>
      {invoice?.pay_reference && (
        <div className="rounded-lg border border-dashed p-4 text-sm">
          <p className="font-mono text-lg">{invoice.pay_reference}</p>
          <p>{invoice.amount_fcfa?.toLocaleString("fr-FR")} FCFA</p>
          <p className="text-muted-foreground mt-2">{invoice.instructions}</p>
        </div>
      )}
    </div>
  );
}
