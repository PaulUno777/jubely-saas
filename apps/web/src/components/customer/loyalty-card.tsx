import { useTranslations } from "next-intl";
import { JubelyLogo } from "@jubely/ui";

type LoyaltyCardProps = {
  token: string;
  name: string;
  points: number;
  tier: string;
  storeName: string;
  tierPct?: number;
};

function QrGlyph({ size = 84 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, background: "#fff", borderRadius: 16, padding: 8,
      display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(9, 1fr)", gap: 1.5 }}>
      {Array.from({ length: 81 }, (_, i) => {
        const s = (i * 7 + 13) % 11;
        return <i key={i} style={{ background: s > 4 ? "var(--c-card)" : "transparent", borderRadius: 1 }} />;
      })}
    </div>
  );
}

export function LoyaltyCard({ name, points, tier, storeName, tierPct = 72 }: LoyaltyCardProps) {
  const t = useTranslations("customer.wallet");
  const upper = name.toUpperCase();

  return (
    <div className="c-card-dark" style={{ padding: 18, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <JubelyLogo size="xs" iconOnly />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
          borderRadius: 999, background: "rgba(212,174,108,0.15)", color: "var(--c-gold-2)",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
          {t("tierLabel")} {tier}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "flex-start" }}>
        <QrGlyph size={84} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em", fontWeight: 600 }}>
            {t("loyaltyTierLabel")}
          </div>
          <div style={{ fontSize: 12, color: "var(--c-gold-2)", fontWeight: 600, letterSpacing: "0.08em", marginTop: 2 }}>
            {storeName.toUpperCase()}
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 38, color: "var(--c-cream)", lineHeight: 1 }}>
              {points.toLocaleString("fr-FR")}
            </span>
            <span style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>pts</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em", fontWeight: 600 }}>{t("cardholder")}</div>
          <div style={{ fontSize: 13, color: "var(--c-cream)", letterSpacing: "0.08em", marginTop: 2, fontWeight: 600 }}>{upper}</div>
        </div>
        <div style={{ width: 36, height: 26, borderRadius: 6, background: "var(--c-gold-3)", color: "var(--c-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="14" viewBox="0 0 22 16" fill="currentColor"><rect x="0" y="0" width="22" height="6" rx="1" /><rect x="0" y="9" width="10" height="7" rx="1" /><rect x="12" y="9" width="10" height="7" rx="1" /></svg>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="c-tier-bar-track"><span className="c-tier-bar-fill" style={{ width: `${tierPct}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, fontWeight: 500 }}>
          <span style={{ color: "#87613a" }}>{t("tierBronze")}</span>
          <span style={{ color: "#a6a094" }}>{t("tierSilver")}</span>
          <span style={{ color: "var(--c-gold-2)" }}>{t("tierGold")}</span>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>{t("tierPlatinum")}</span>
        </div>
      </div>
    </div>
  );
}
