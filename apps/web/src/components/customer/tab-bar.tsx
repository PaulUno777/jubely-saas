"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconWallet, IconQrCode, IconMap } from "./icons";
import { IconGift, IconAccount } from "@/components/agent/icons";

type Tab = {
  id: string;
  href: string;
  labelKey: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  fab?: boolean;
};

const TABS: Tab[] = [
  { id: "wallet",   href: "/customer/wallet",   labelKey: "tabWallet",   Icon: IconWallet },
  { id: "rewards",  href: "/customer/rewards",  labelKey: "tabRewards",  Icon: IconGift },
  { id: "qr",       href: "/customer/qr",       labelKey: "tabScan",     Icon: IconQrCode, fab: true },
  { id: "stores",   href: "/customer/stores",   labelKey: "tabStores",   Icon: IconMap },
  { id: "settings", href: "/customer/settings", labelKey: "tabProfile",  Icon: IconAccount },
];

function isActive(href: string, pathname: string) {
  if (href === "/customer/wallet") return pathname === "/customer/wallet" || pathname === "/customer";
  return pathname.startsWith(href);
}

export function CustomerTabBar() {
  const pathname = usePathname();
  const t = useTranslations("customer");

  return (
    <nav className="c-tabbar" role="tablist">
      {TABS.map(({ id, href, labelKey, Icon, fab }) =>
        fab ? (
          <div key={id} style={{ position: "relative" }}>
            <Link href={href} className="c-tab-fab" aria-label={t(labelKey as never)}>
              <Icon size={28} />
            </Link>
            <span style={{ position: "absolute", bottom: -22, left: 0, right: 0, textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--c-ink)" }}>
              {t(labelKey as never)}
            </span>
          </div>
        ) : (
          <Link key={id} href={href} className="c-tab" data-active={isActive(href, pathname)} role="tab">
            <Icon size={22} color={isActive(href, pathname) ? "var(--c-gold-3)" : "var(--c-ink-mut)"} />
            <span>{t(labelKey as never)}</span>
          </Link>
        ),
      )}
    </nav>
  );
}
