"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTenantId } from "@/hooks/useTenantId";
import { agentListPointEvents } from "@/lib/agentApi";
import { ActivityRow } from "@/components/agent/activity-row";
import type { StorePointEvent } from "@jubely/api-schemas";

type FilterKey = "filterAll" | "filterAward" | "filterRedeem" | "filterSignup";

function toType(ev: StorePointEvent): "award" | "redeem" | "signup" {
  if (ev.event_type === "signup") return "signup";
  return ev.delta < 0 ? "redeem" : "award";
}

function formatDate(d: string | number | Date) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityPage() {
  const t = useTranslations("agent.activity");
  const [filter, setFilter] = useState<FilterKey>("filterAll");

  const tenantId = useTenantId();
  const { data = [], isLoading } = useQuery({
    queryKey: ["agent", "activity", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => agentListPointEvents(tenantId!, { limit: 50 }),
  });

  const filtered = data.filter((ev) => {
    const type = toType(ev);
    if (filter === "filterAward")  return type === "award";
    if (filter === "filterRedeem") return type === "redeem";
    if (filter === "filterSignup") return type === "signup";
    return true;
  });

  const totalAwarded  = data.filter((e) => toType(e) === "award").reduce((s, e) => s + e.delta, 0);
  const totalRedeemed = data.filter((e) => toType(e) === "redeem").reduce((s, e) => s + Math.abs(e.delta), 0);

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600 }}>
            {t("title")}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("title")}</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--a-cream-2)", color: "var(--a-ink-mut)", fontSize: 11, fontWeight: 600 }}>
          {t("period")}
        </span>
      </div>

      {/* Summary card */}
      <div style={{ padding: "4px 16px 0" }}>
        <div style={{ background: "var(--a-cream-2)", borderRadius: 22, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--a-green)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--a-green)" }} />
                {t("awardedLabel")}
              </div>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 28, color: "var(--a-green)", marginTop: 4, lineHeight: 1 }}>
                +{totalAwarded.toLocaleString("fr-FR")}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--a-gold-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--a-gold)" }} />
                {t("redeemedLabel")}
              </div>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 28, color: "var(--a-gold-3)", marginTop: 4, lineHeight: 1 }}>
                –{totalRedeemed.toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "14px 20px 6px", display: "flex", gap: 8, overflowX: "auto" }}>
        {(["filterAll", "filterAward", "filterRedeem", "filterSignup"] as FilterKey[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              appearance: "none", border: 0, cursor: "pointer",
              padding: "6px 12px", borderRadius: 999,
              background: filter === f ? "var(--a-card)" : "var(--a-cream-2)",
              color: filter === f ? "var(--a-cream)" : "var(--a-ink)",
              fontFamily: "inherit", fontSize: 12, fontWeight: 500, flexShrink: 0,
            }}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ padding: "6px 20px 16px" }}>
        {isLoading && <p style={{ fontSize: 13, color: "var(--a-ink-mut)", margin: "20px 0" }}>…</p>}
        {!isLoading && filtered.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--a-ink-mut)", textAlign: "center", margin: "40px 0" }}>{t("noActivity")}</p>
        )}
        {filtered.map((ev) => (
          <ActivityRow
            key={ev.event_id}
            type={toType(ev)}
            client={ev.customer_name ?? ev.customer_phone ?? "—"}
            time={formatDate(ev.created_at)}
            points={Math.abs(ev.delta)}
            amount={typeof (ev.payload as { amount_fcfa?: number })?.amount_fcfa === "number" ? (ev.payload as { amount_fcfa: number }).amount_fcfa : undefined}
          />
        ))}
      </div>
    </div>
  );
}
