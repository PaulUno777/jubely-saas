"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { customerGetWallet } from "@/lib/customerApi";
import { IconQrCode, IconHeart, IconBookmark } from "@/components/customer/icons";
import { IconBell, IconShield, IconReceipt, IconLogout, IconChevronRight, IconStore, IconUser } from "@/components/agent/icons";
import { JubelyLogo } from "@jubely/ui";
import { clearSession, useSessionStore } from "@/lib/session";

type MenuRowProps = {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string; sub?: string; danger?: boolean; onClick?: () => void; last?: boolean;
};

function MenuRow({ Icon, title, sub, danger, onClick, last }: MenuRowProps) {
  return (
    <div className={last ? "" : ""} onClick={onClick}
      style={{ padding: "14px 16px", borderBottom: last ? "none" : "0.5px solid var(--c-line)", display: "flex", alignItems: "center", gap: 12, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: danger ? "var(--c-red-bg)" : "var(--c-cream-2)", color: danger ? "var(--c-red)" : "var(--c-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? "var(--c-red)" : "var(--c-ink)" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--c-ink-mut)", marginTop: 1 }}>{sub}</div>}
      </div>
      {!danger && <IconChevronRight size={14} color="var(--c-ink-mut)" />}
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("customer.settings");
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const { data } = useQuery({
    queryKey: ["pwa", "wallet", session?.activeEnrollmentId],
    enabled: Boolean(session?.activeEnrollmentId),
    queryFn: () => customerGetWallet(),
  });

  const initials = data?.tenant_name?.slice(0, 2).toUpperCase() ?? "?";
  const totalPts = data?.points_balance ?? 0;

  function handleSignOut() {
    clearSession();
    router.push("/customer/wallet");
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "12px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600 }}>{t("title")}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("myProfile")}</div>
      </div>

      {/* User card */}
      <div style={{ padding: "4px 16px 0" }}>
        <div className="c-card-dark" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--c-green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 24, color: "var(--c-cream)", lineHeight: 1.1 }}>
                {data?.tenant_name ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{data?.tier ?? "—"}</div>
            </div>
            <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 999, background: "rgba(212,174,108,0.15)", color: "var(--c-gold-2)", fontSize: 11, fontWeight: 600 }}>{data?.tier ?? "—"}</span>
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            {[
              { lbl: t("totalPoints"), val: totalPts.toLocaleString("fr-FR"), accent: true },
              { lbl: t("programs"), val: String(session?.customerEnrollments.length ?? 0) },
              { lbl: t("rewardsUsed"), val: "—" },
            ].map((s, i) => (
              <div key={i} style={{ paddingLeft: i === 0 ? 0 : 10, borderLeft: i === 0 ? "none" : "0.5px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{s.lbl}</div>
                <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 22, color: (s as { accent?: boolean }).accent ? "var(--c-gold-2)" : "var(--c-cream)", marginTop: 2, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Show QR shortcut */}
      <div style={{ padding: "14px 16px 0" }}>
        <div className="c-card-cream" style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => router.push("/customer/qr")}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--c-card)", color: "var(--c-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconQrCode size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t("showQr")}</div>
            <div style={{ fontSize: 11.5, color: "var(--c-ink-mut)" }}>{t("showQrSub")}</div>
          </div>
          <IconChevronRight size={16} color="var(--c-ink-mut)" />
        </div>
      </div>

      {/* Account section */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, padding: "0 4px 6px" }}>{t("account")}</div>
        <div style={{ background: "var(--c-cream)", border: "1px solid var(--c-line)", borderRadius: 20 }}>
          <MenuRow Icon={IconUser}     title={t("personalInfo")}  sub={t("personalInfoSub")} />
          <MenuRow Icon={IconShield}   title={t("security")} />
          <MenuRow Icon={IconBookmark} title={t("addresses")} last />
        </div>
      </div>

      {/* Preferences */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, padding: "0 4px 6px" }}>{t("preferences")}</div>
        <div style={{ background: "var(--c-cream)", border: "1px solid var(--c-line)", borderRadius: 20 }}>
          <MenuRow Icon={IconBell}  title={t("notifications")} />
          <MenuRow Icon={IconStore} title={t("interests")} last />
        </div>
      </div>

      {/* Help + sign out */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, padding: "0 4px 6px" }}>{t("help")}</div>
        <div style={{ background: "var(--c-cream)", border: "1px solid var(--c-line)", borderRadius: 20 }}>
          <MenuRow Icon={IconReceipt} title={t("history")} />
          <MenuRow Icon={IconHeart}   title={t("suggest")} />
          <MenuRow Icon={IconShield}  title={t("privacy")} />
          <MenuRow Icon={IconLogout}  title={t("signOut")} danger onClick={handleSignOut} last />
        </div>
        <div style={{ fontSize: 11, color: "var(--c-ink-mut)", textAlign: "center", marginTop: 14 }}>
          <JubelyLogo size="xs" className="justify-center" /> {t("version")}
        </div>
      </div>
    </div>
  );
}
