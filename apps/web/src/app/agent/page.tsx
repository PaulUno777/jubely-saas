"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/useSession";
import { storeGetMetrics, storeListPointEvents } from "@/lib/storeApi";
import { ActivityRow } from "@/components/agent/activity-row";
import {
  IconBell,
  IconScan,
  IconGift,
  IconPlus,
  IconUsers,
  IconClock,
} from "@/components/agent/icons";
import { SpotlightCard, JubelyLogo } from "@jubely/ui";
import type { StorePointEvent } from "@jubely/api-schemas";

function greeting(t: ReturnType<typeof useTranslations<"agent.home">>) {
  const h = new Date().getHours();
  if (h < 12) return t("greetingMorning");
  if (h < 18) return t("greetingAfternoon");
  return t("greetingEvening");
}

function toActivityType(ev: StorePointEvent): "award" | "redeem" | "signup" {
  if (ev.event_type === "signup") return "signup";
  if (ev.delta < 0) return "redeem";
  return "award";
}

function formatTime(d: string | number | Date) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgentHomePage() {
  const t = useTranslations("agent.home");
  const { session } = useSession();

  const metricsQ = useQuery({
    queryKey: ["agent", "metrics"],
    queryFn: storeGetMetrics,
  });
  const feedQ = useQuery({
    queryKey: ["agent", "feed"],
    queryFn: () => storeListPointEvents({ limit: 4 }),
  });

  const displayName = session?.email?.split("@")[0] ?? "—";
  const pts = metricsQ.data?.points_distributed ?? 0;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <JubelyLogo size="xs" />
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--a-cream-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBell size={18} />
          </div>
          <Link
            href="/agent/profile"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--a-card)",
              color: "var(--a-gold-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "14px 20px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--a-ink-mut)" }}>
            {greeting(t)},
          </span>
          <span
            style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            {displayName}
          </span>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: "0 16px" }}>
        <SpotlightCard portal="agent" density="compact">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "var(--jb-portal-card-accent-soft)",
                  color: "var(--jb-portal-card-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconClock size={14} />
              </span>
              <span
                style={{
                  fontFamily: "var(--jubely-font-display)",
                  fontStyle: "italic",
                  color: "var(--jb-portal-card-text)",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                {t("shiftActive")}
              </span>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                color: "var(--jb-portal-card-accent)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span
                className="a-pulse-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--a-green-2)",
                }}
              />
              {t("shiftActive")}
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--jb-portal-card-muted)",
                fontWeight: 600,
              }}
            >
              {t("pointsIssued")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--jubely-font-display)",
                  fontStyle: "italic",
                  fontSize: 44,
                  color: "var(--jb-portal-card-accent)",
                  lineHeight: 1,
                  letterSpacing: "-0.005em",
                }}
              >
                {pts.toLocaleString("fr-FR")}
              </span>
              <span
                style={{
                  fontFamily: "var(--jubely-font-display)",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "var(--jb-portal-card-muted)",
                }}
              >
                pts
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 0,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "0.5px solid var(--jb-portal-card-line)",
            }}
          >
            {[
              {
                lbl: t("clients"),
                val: metricsQ.data?.point_events_this_month ?? "—",
              },
              { lbl: t("rewards"), val: "—" },
              { lbl: t("newClients"), val: "—" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  minWidth: 0,
                  paddingLeft: i === 0 ? 0 : 12,
                  borderLeft:
                    i === 0 ? "none" : "0.5px solid var(--jb-portal-card-line)",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--jb-portal-card-muted)",
                    fontWeight: 600,
                  }}
                >
                  {s.lbl}
                </div>
                <div
                  style={{
                    fontFamily: "var(--jubely-font-display)",
                    fontStyle: "italic",
                    fontSize: 22,
                    color: "var(--jb-portal-card-text)",
                    marginTop: 2,
                    lineHeight: 1,
                  }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "20px 16px 0" }}>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--a-ink-mut)",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {t("quickActions")}
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <ActionTile
            tone="dark"
            title={t("actionAward")}
            sub={t("actionAwardSub")}
            Icon={IconScan}
            href="/agent/scanner?mode=award"
          />
          <ActionTile
            tone="gold"
            title={t("actionValidate")}
            sub={t("actionValidateSub")}
            Icon={IconGift}
            href="/agent/scanner?mode=validate"
          />
          <ActionTile
            tone="cream"
            title={t("actionNewClient")}
            sub={t("actionNewClientSub")}
            Icon={IconPlus}
            href="/agent/customers/new"
          />
          <ActionTile
            tone="cream"
            title={t("actionDirectory")}
            sub={t("actionDirectorySub", { count: "50" })}
            Icon={IconUsers}
            href="/agent/customers"
          />
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ padding: "24px 20px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--a-ink-mut)",
              fontWeight: 600,
            }}
          >
            {t("recentActivity")}
          </div>
          <Link
            href="/agent/activity"
            style={{
              fontSize: 12.5,
              color: "var(--a-green)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {t("seeAll")}
          </Link>
        </div>
        {feedQ.data?.length ? (
          feedQ.data
            .slice(0, 4)
            .map((ev) => (
              <ActivityRow
                key={ev.event_id}
                type={toActivityType(ev)}
                client={ev.customer_name ?? ev.customer_phone ?? "—"}
                time={formatTime(ev.created_at)}
                points={Math.abs(ev.delta)}
                amount={
                  typeof (ev.payload as { amount_fcfa?: number })
                    ?.amount_fcfa === "number"
                    ? (ev.payload as { amount_fcfa: number }).amount_fcfa
                    : undefined
                }
              />
            ))
        ) : (
          <p style={{ fontSize: 13, color: "var(--a-ink-mut)", margin: 0 }}>
            {t("noActivity")}
          </p>
        )}
      </div>
    </div>
  );
}

type ToneKey = "dark" | "gold" | "cream";
const TONE = {
  dark: { bg: "var(--a-card)", color: "var(--a-cream)", ic: "var(--a-gold-2)" },
  gold: {
    bg: "var(--a-gold-bg)",
    color: "var(--a-ink)",
    ic: "var(--a-gold-3)",
  },
  cream: { bg: "var(--a-cream-2)", color: "var(--a-ink)", ic: "var(--a-ink)" },
} as const;

function ActionTile({
  tone,
  title,
  sub,
  Icon,
  href,
}: {
  tone: ToneKey;
  title: string;
  sub: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  href: string;
}) {
  const { bg, color, ic } = TONE[tone];
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        background: bg,
        color,
        borderRadius: 18,
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 92,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: tone === "dark" ? "rgba(255,255,255,0.08)" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={ic} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.005 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{sub}</div>
      </div>
    </Link>
  );
}
