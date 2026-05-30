"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { customerGetWallet } from "@/lib/customerApi";
import { LoyaltyCard } from "@/components/customer/loyalty-card";
import { MoveRow } from "@/components/customer/move-row";
import { IconQrCode, IconMap } from "@/components/customer/icons";
import { IconGift, IconReceipt, IconBell } from "@/components/agent/icons";
import { JubelyLogo } from "@jubely/ui";
import { useSession } from "@/hooks/useSession";

function greeting(t: ReturnType<typeof useTranslations<"customer.wallet">>) {
  const h = new Date().getHours();
  if (h < 12) return t("greetingMorning");
  if (h < 18) return t("greetingAfternoon");
  return t("greetingEvening");
}

function toType(ev: { event_type: string; delta: number }): "award" | "redeem" | "signup" {
  if (ev.event_type === "signup") return "signup";
  return ev.delta < 0 ? "redeem" : "award";
}

function formatTime(d: string | number | Date) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type ActionTileProps = { Icon: React.ComponentType<{ size?: number; color?: string }>; label: string; href: string; active?: boolean };

function ActionTile({ Icon, label, href, active }: ActionTileProps) {
  return (
    <Link href={href} className="c-action-tile" style={{ textDecoration: "none" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16,
        background: active ? "var(--c-green)" : "var(--c-cream-2)",
        color: active ? "var(--c-gold-2)" : "var(--c-ink)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--c-ink)" }}>{label}</span>
    </Link>
  );
}

export default function CustomerWalletPage() {
  const t = useTranslations("customer.wallet");
  const { session } = useSession();
  const activeEnrollmentId = session?.activeEnrollmentId;
  const hasPrograms = (session?.customerEnrollments.length ?? 0) > 0;

  const { data } = useQuery({
    queryKey: ["pwa", "wallet", activeEnrollmentId],
    enabled: Boolean(activeEnrollmentId),
    queryFn: () => customerGetWallet(),
  });

  const displayName = data?.tenant_name ? "Customer" : "—";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <JubelyLogo size="xs" />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--c-cream-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconBell size={18} />
          </div>
          <Link href="/customer/settings" style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--c-card)", color: "var(--c-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            {initials}
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "18px 20px 12px" }}>
        <div style={{ fontSize: 13.5, color: "var(--c-ink-mut)" }}>{greeting(t)}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>
          {data?.tenant_name ?? t("empty").split(".")[0]}
        </div>
      </div>

      {/* Loyalty card or empty state */}
      <div style={{ padding: "0 16px" }}>
        {data ? (
          <LoyaltyCard token={data.customer_qr ?? ""} name="Customer" points={data.points_balance} tier={data.tier} storeName={data.tenant_name} />
        ) : (
          <div className="c-card-dark" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 14 }}>{t("empty")}</div>
            <Link href="/customer/enroll" style={{ display: "inline-block", background: "var(--c-gold-2)", color: "var(--c-card)", borderRadius: 12, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
              {t("enrollCta")}
            </Link>
          </div>
        )}
      </div>

      {/* Action tiles */}
      <div style={{ padding: "20px 16px 4px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <ActionTile Icon={IconQrCode}  label={t("actionMyQr")}     href="/customer/qr"      active />
        <ActionTile Icon={IconGift}    label={t("actionRewards")}  href="/customer/rewards" />
        <ActionTile Icon={IconReceipt} label={t("actionHistory")}  href="/customer/history" />
        <ActionTile Icon={IconMap}     label={t("actionStores")}   href="/customer/stores"  />
      </div>

      {hasPrograms && (session?.customerEnrollments.length ?? 0) > 1 ? (
        <div style={{ padding: "8px 20px 0", fontSize: 12.5, color: "var(--c-ink-mut)" }}>
          Active program: {data?.tenant_name ?? session?.customerEnrollments[0]?.tenantName} ·{" "}
          <Link href="/customer/stores" style={{ color: "var(--c-green)", textDecoration: "none", fontWeight: 600 }}>
            switch
          </Link>
        </div>
      ) : null}

      {/* Recent moves */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600 }}>{t("recentMoves")}</div>
          <Link href="/customer/history" style={{ fontSize: 12.5, color: "var(--c-green)", fontWeight: 600, textDecoration: "none" }}>{t("seeAll")}</Link>
        </div>
        {data?.recent_events.length ? (
          data.recent_events.slice(0, 4).map((ev) => (
            <MoveRow
              key={ev.event_id}
              type={toType(ev)}
              label={ev.event_type}
              meta={formatTime(ev.created_at)}
              points={Math.abs(ev.delta)}
            />
          ))
        ) : (
          <p style={{ fontSize: 13, color: "var(--c-ink-mut)", margin: 0 }}>{t("noMoves")}</p>
        )}
      </div>
    </div>
  );
}
