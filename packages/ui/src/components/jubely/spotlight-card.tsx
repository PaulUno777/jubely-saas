import * as React from "react";
import { cn } from "../../cn";

type SpotlightCardVariant = "customer" | "agent" | "admin";
type SpotlightCardDensity = "comfortable" | "compact";

type AdaptiveSpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  portal?: SpotlightCardVariant;
  accentColor?: string;
  density?: SpotlightCardDensity;
};

type PortalPalette = {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glow: string;
  shadow: string;
  text: string;
  muted: string;
  accent: string;
  line: string;
  patternOpacity: string;
  glossOpacity: string;
};

const PORTAL_PALETTE: Record<SpotlightCardVariant, PortalPalette> = {
  customer: {
    // Matched to the reference card: charcoal olive base with a warm gold bloom.
    bgStart: "#1e1a11",
    bgMid: "#332c1c",
    bgEnd: "#917334",
    glow: "rgba(212, 174, 108, 0.30)",
    shadow: "rgba(22, 18, 10, 0.28)",
    text: "var(--c-cream, #f6f4ef)",
    muted: "rgba(255, 255, 255, 0.58)",
    accent: "var(--c-gold-2, #d4ae6c)",
    line: "rgba(255, 255, 255, 0.10)",
    patternOpacity: "0.22",
    glossOpacity: "0.34",
  },
  agent: {
    bgStart: "color-mix(in srgb, var(--a-card, #1d2b22) 96%, #060704)",
    bgMid: "color-mix(in srgb, var(--a-card, #1d2b22) 76%, var(--a-gold, #b8924a) 24%)",
    bgEnd: "color-mix(in srgb, var(--a-gold-2, #d4ae6c) 54%, var(--a-card, #1d2b22) 46%)",
    glow: "color-mix(in srgb, var(--a-gold-2, #d4ae6c) 24%, transparent)",
    shadow: "rgba(12, 18, 14, 0.28)",
    text: "var(--a-cream, #f2f5f3)",
    muted: "rgba(255, 255, 255, 0.56)",
    accent: "var(--a-gold-2, #d4ae6c)",
    line: "rgba(255, 255, 255, 0.10)",
    patternOpacity: "0.18",
    glossOpacity: "0.28",
  },
  admin: {
    bgStart: "color-mix(in srgb, var(--card, #181511) 96%, #040302)",
    bgMid: "color-mix(in srgb, var(--card, #181511) 78%, var(--primary, #c89b3c) 22%)",
    bgEnd: "color-mix(in srgb, var(--primary, #c89b3c) 52%, var(--card, #181511) 48%)",
    glow: "color-mix(in srgb, var(--primary, #c89b3c) 20%, transparent)",
    shadow: "rgba(8, 6, 2, 0.34)",
    text: "var(--card-foreground, #f2ece3)",
    muted: "color-mix(in srgb, var(--card-foreground, #f2ece3) 56%, transparent)",
    accent: "var(--primary, #c89b3c)",
    line: "rgba(255, 255, 255, 0.10)",
    patternOpacity: "0.16",
    glossOpacity: "0.24",
  },
};

export function SpotlightCard({
  portal = "customer",
  accentColor,
  density = "comfortable",
  className,
  style,
  children,
  ...props
}: AdaptiveSpotlightCardProps) {
  const palette = PORTAL_PALETTE[portal];
  const accent = accentColor ?? palette.accent;

  const cssVars = {
    "--jb-portal-card-bg-start": palette.bgStart,
    "--jb-portal-card-bg-mid": palette.bgMid,
    "--jb-portal-card-bg-end": palette.bgEnd,
    "--jb-portal-card-glow": palette.glow,
    "--jb-portal-card-shadow": palette.shadow,
    "--jb-portal-card-text": palette.text,
    "--jb-portal-card-muted": palette.muted,
    "--jb-portal-card-accent": accent,
    "--jb-portal-card-accent-soft": `color-mix(in srgb, ${accent} 16%, transparent)`,
    "--jb-portal-card-line": palette.line,
    "--jb-portal-card-pattern-opacity": palette.patternOpacity,
    "--jb-portal-card-gloss-opacity": palette.glossOpacity,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "jb-portal-card",
        density === "compact" && "jb-portal-card--compact",
        className,
      )}
      style={cssVars}
      {...props}
    >
      <div className="jb-portal-card__inner">{children}</div>
    </div>
  );
}
