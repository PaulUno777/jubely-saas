"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTenantId } from "@/hooks/useTenantId";
import { agentListCustomers } from "@/lib/agentApi";
import type { StoreCustomer } from "@jubely/api-schemas";
import { IconSearch, IconPlus, IconChevronRight } from "@/components/agent/icons";

const FILTERS = ["filterAll", "filterNew"] as const;
type Filter = (typeof FILTERS)[number];

function tierToTone(tier: string) {
  if (tier.toLowerCase().includes("gold") || tier.toLowerCase().includes("or")) return "gold";
  if (tier.toLowerCase().includes("silver") || tier.toLowerCase().includes("argent")) return "silver";
  return "bronze";
}

const AVATAR_STYLE: Record<string, { bg: string; color: string }> = {
  gold:   { bg: "var(--a-gold-bg)", color: "var(--a-gold-3)" },
  silver: { bg: "#e8e6df",          color: "#6e6a5f" },
  bronze: { bg: "#efddc8",          color: "#87613a" },
};

function ClientRow({ c }: { c: StoreCustomer }) {
  const tone = tierToTone(c.tier);
  const { bg, color } = AVATAR_STYLE[tone] ?? AVATAR_STYLE.bronze;
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Link href={`/agent/customers/${c.enrollment_id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="a-row-client" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--a-line)", cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          <div style={{ fontSize: 12, color: "var(--a-ink-mut)", marginTop: 1 }}>{c.phone}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 18, color: "var(--a-ink)", lineHeight: 1 }}>
            {c.points_balance.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--a-gold-3)", marginTop: 2, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{c.tier}</div>
        </div>
        <IconChevronRight size={14} color="var(--a-ink-mut)" />
      </div>
    </Link>
  );
}

export default function CustomersPage() {
  const t = useTranslations("agent.customers");
  const [filter, setFilter] = useState<Filter>("filterAll");
  const [query, setQuery] = useState("");

  const tenantId = useTenantId();
  const { data = [], isLoading } = useQuery({
    queryKey: ["agent", "customers", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => agentListCustomers(tenantId!, { limit: 100 }),
  });

  const filtered = data.filter((c) => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.phone.includes(query)) return false;
    return true;
  });

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600 }}>{t("listTitle")}</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("listTitle")}</div>
        </div>
        <Link href="/agent/customers/new" style={{ width: 42, height: 42, borderRadius: 14, background: "var(--a-card)", color: "var(--a-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <IconPlus size={20} />
        </Link>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 20px 8px" }}>
        <div style={{ background: "var(--a-cream-2)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <IconSearch size={18} color="var(--a-ink-mut)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            style={{ border: 0, background: "transparent", outline: 0, fontFamily: "inherit", fontSize: 14, color: "var(--a-ink)", flex: 1 }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "4px 20px 8px", display: "flex", gap: 8, overflowX: "auto" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            type="button"
            style={{
              appearance: "none", border: 0, cursor: "pointer",
              padding: "7px 14px", borderRadius: 999,
              background: filter === f ? "var(--a-card)" : "var(--a-cream-2)",
              color: filter === f ? "var(--a-cream)" : "var(--a-ink)",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, flexShrink: 0,
            }}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ padding: "4px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--a-ink-mut)" }}>
        <span>{filtered.length} {t("listTitle").toLowerCase()}</span>
        <span style={{ cursor: "pointer" }}>{t("sortRecent")}</span>
      </div>

      {/* List */}
      <div style={{ padding: "4px 20px 16px" }}>
        {isLoading
          ? <p style={{ fontSize: 13, color: "var(--a-ink-mut)", margin: "20px 0" }}>…</p>
          : filtered.length === 0
            ? <p style={{ fontSize: 13, color: "var(--a-ink-mut)", margin: "40px 0", textAlign: "center" }}>{t("noResults")}</p>
            : filtered.map((c) => <ClientRow key={c.enrollment_id} c={c} />)
        }
      </div>
    </div>
  );
}
