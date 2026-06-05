"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/useSession";
import { clearSession } from "@/lib/session";
import { useStoreTenant } from "@/hooks/useStoreTenant";
import {
  IconBell, IconStore, IconReceipt, IconShield, IconChevronRight, IconLogout,
} from "@/components/agent/icons";
import { JubelyLogo } from "@jubely/ui";

type SettingRow = {
  key: string;
  labelKey: string;
  subKey?: string;
};

const SETTINGS: SettingRow[] = [
  { key: "notifications", labelKey: "notifications", subKey: "notificationsSub" },
  { key: "rule",          labelKey: "accumulationRule" },
  { key: "history",       labelKey: "codeHistory" },
  { key: "security",      labelKey: "security" },
];

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  notifications: IconBell,
  rule:          IconStore,
  history:       IconReceipt,
  security:      IconShield,
};

export default function ProfilePage() {
  const t = useTranslations("agent.profile");
  const { session } = useSession();
  const tenantQ = useStoreTenant();

  const displayName = session?.email?.split("@")[0] ?? "Agent";
  const initials = displayName.slice(0, 2).toUpperCase();
  const merchantName = tenantQ.data?.name ?? "—";

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600 }}>{t("title")}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("myPost")}</div>
      </div>

      {/* Staff card */}
      <div style={{ padding: "4px 16px 0" }}>
        <div className="a-card-dark" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--a-gold-2)", color: "var(--a-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 26, color: "var(--a-cream)", lineHeight: 1.1 }}>{displayName}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{session?.role ?? "Staff"}</div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(212,174,108,0.15)", color: "var(--a-gold-2)", fontSize: 11, fontWeight: 600 }}>
              <span className="a-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--a-green-2)" }} />
              {t("onDuty")}
            </span>
          </div>
        </div>
      </div>

      {/* Merchant */}
      <div style={{ padding: "20px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600, marginBottom: 8 }}>{t("store")}</div>
        <div style={{ background: "var(--a-cream)", border: "1px solid var(--a-line)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--a-card)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <JubelyLogo size="xs" iconOnly />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{merchantName}</div>
            <div style={{ fontSize: 12, color: "var(--a-ink-mut)" }}>{session?.tenantId ?? "—"}</div>
          </div>
          <IconChevronRight size={16} color="var(--a-ink-mut)" />
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: "14px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600, marginBottom: 8 }}>{t("preferences")}</div>
        <div style={{ background: "var(--a-cream)", border: "1px solid var(--a-line)", borderRadius: 22, overflow: "hidden" }}>
          {SETTINGS.map(({ key, labelKey, subKey }, i) => {
            const Icon = ICONS[key] ?? IconStore;
            return (
              <div
                key={key}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < SETTINGS.length - 1 ? "0.5px solid var(--a-line)" : "none",
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--a-cream-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t(labelKey as never)}</div>
                  {subKey && <div style={{ fontSize: 11.5, color: "var(--a-ink-mut)", marginTop: 1 }}>{t(subKey as never)}</div>}
                </div>
                <IconChevronRight size={14} color="var(--a-ink-mut)" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: "14px 20px 24px" }}>
        <button
          type="button"
          onClick={() => clearSession()}
          style={{ width: "100%", background: "var(--a-red-bg)", color: "var(--a-red)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <IconLogout size={16} /> {t("signOut")}
        </button>
        <div style={{ fontSize: 11, color: "var(--a-ink-mut)", textAlign: "center", marginTop: 12 }}>
          {t("version")} · {session?.role}
        </div>
      </div>
    </div>
  );
}
