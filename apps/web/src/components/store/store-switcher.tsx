"use client";

import { useCallback, useEffect, useState } from "react";
import { authedJson } from "@/lib/http";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  is_hq: boolean;
};

export function StoreSwitcher() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authedJson<{ stores: StoreRow[] }>("/v1/organizations/me/stores");
        setStores(res.stores ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const switchStore = useCallback(async (storeId: string) => {
    const me = await authedJson<{ membership_id?: string }>("/api/auth/me");
    if (!me.membership_id) return;
    await authedJson("/v1/auth/workspace", {
      method: "POST",
      json: { membership_id: me.membership_id, active_store_id: storeId },
    });
    setActiveId(storeId);
    window.location.reload();
  }, []);

  if (loading || stores.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Boutique</span>
      <select
        className="rounded-md border bg-background px-2 py-1"
        value={activeId ?? stores[0]?.id ?? ""}
        onChange={(e) => void switchStore(e.target.value)}
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.is_hq ? " (HQ)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
