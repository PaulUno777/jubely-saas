"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { pwaGetWallet } from "@/lib/customerApi";
import { loadCustomerQr, subscribeCustomerQr } from "@/lib/customerSession";
import { IconGift, IconChevronRight, IconCheck } from "@/components/agent/icons";
import { IconStar, IconSparkle } from "@/components/customer/icons";

type RewardItem = { Icon: React.ComponentType<{ size?: number; color?: string }>; title: string; cost: number; available: boolean };

const DEMO_REWARDS: RewardItem[] = [
  { Icon: IconGift,    title: "Free item",         cost: 200,  available: true  },
  { Icon: IconSparkle, title: "VIP discount",      cost: 500,  available: true  },
  { Icon: IconStar,    title: "Premium reward",    cost: 1200, available: false },
];

function RewardRow({ item, balance }: { item: RewardItem; balance: number }) {
  const t = useTranslations("customer.rewards");
  const canClaim = item.available && balance >= item.cost;

  return (
    <div style={{ background: "var(--c-cream)", border: "1px solid var(--c-line)", borderRadius: 18, overflow: "hidden", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: item.available ? "var(--c-mint)" : "var(--c-cream-2)",
          color: item.available ? "var(--c-green)" : "var(--c-ink-mut)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <item.Icon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-ink)" }}>{item.title}</div>
          <div style={{ fontSize: 12, color: "var(--c-ink-mut)", marginTop: 2 }}>
            {t("pointsCost", { pts: String(item.cost) })}
            {!item.available && ` · ${t("locked")}`}
          </div>
        </div>
        <button type="button" disabled={!canClaim}
          style={{ appearance: "none", border: 0, cursor: canClaim ? "pointer" : "default",
            padding: "8px 14px", borderRadius: 999,
            background: canClaim ? "var(--c-green)" : "var(--c-cream-2)",
            color: canClaim ? "#fff" : "var(--c-ink-mut)",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, opacity: item.available ? 1 : 0.5 }}>
          {canClaim ? t("claim") : item.available ? t("preview") : t("locked")}
        </button>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const t = useTranslations("customer.rewards");
  const token = useSyncExternalStore(subscribeCustomerQr, loadCustomerQr, () => null);
  const { data } = useQuery({
    queryKey: ["pwa", "wallet", token],
    enabled: Boolean(token),
    queryFn: () => pwaGetWallet(token!),
  });
  const balance = data?.points_balance ?? 0;

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ padding: "12px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600 }}>{t("title")}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("title")}</div>
      </div>

      {data && (
        <div style={{ padding: "4px 16px 0" }}>
          <div className="c-card-dark" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{t("yourBalance")}</div>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 34, color: "var(--c-gold-2)", lineHeight: 1 }}>
                {balance.toLocaleString("fr-FR")}
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>pts</span>
              </div>
            </div>
            <Link href="/customer/wallet" style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)", fontSize: 12.5, textDecoration: "none" }}>
              <IconCheck size={14} /> {data.tier}
            </Link>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, marginBottom: 10 }}>{t("available")}</div>
        {token ? (
          DEMO_REWARDS.map((r, i) => <RewardRow key={i} item={r} balance={balance} />)
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <IconGift size={32} color="var(--c-ink-mut)" />
            <p style={{ fontSize: 13, color: "var(--c-ink-mut)", marginTop: 12 }}>{t("noRewards")}</p>
            <Link href="/customer/enroll" style={{ display: "inline-block", marginTop: 12, background: "var(--c-green)", color: "#fff", borderRadius: 12, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
              {t("enrollCta")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
