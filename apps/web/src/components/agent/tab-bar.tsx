"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  IconHome,
  IconUsers,
  IconScan,
  IconActivity,
  IconAccount,
} from "./icons";

type Tab = {
  id: string;
  href: string;
  labelKey: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  fab?: boolean;
};

const TABS: Tab[] = [
  { id: "home",     href: "/agent",           labelKey: "home.title",    Icon: IconHome },
  { id: "clients",  href: "/agent/customers",  labelKey: "customers.listTitle", Icon: IconUsers },
  { id: "scanner",  href: "/agent/scanner",    labelKey: "scanner.title", Icon: IconScan,     fab: true },
  { id: "activity", href: "/agent/activity",   labelKey: "activity.title",Icon: IconActivity },
  { id: "profile",  href: "/agent/profile",    labelKey: "profile.title", Icon: IconAccount },
];

function isTabActive(href: string, pathname: string) {
  if (href === "/agent") return pathname === "/agent";
  return pathname.startsWith(href);
}

export function AgentTabBar() {
  const pathname = usePathname();
  const t = useTranslations("agent");

  return (
    <nav className="a-tabbar" role="tablist">
      {TABS.map(({ id, href, labelKey, Icon, fab }) =>
        fab ? (
          <div key={id} style={{ position: "relative" }}>
            <Link href={href} className="a-tab-fab" aria-label={t(labelKey as never)}>
              <Icon size={28} />
            </Link>
            <span
              style={{
                position: "absolute", bottom: -22, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 600,
                color: "var(--a-ink)",
              }}
            >
              {t(labelKey as never)}
            </span>
          </div>
        ) : (
          <Link
            key={id}
            href={href}
            className="a-tab"
            data-active={isTabActive(href, pathname)}
            role="tab"
          >
            <Icon
              size={22}
              color={isTabActive(href, pathname) ? "var(--a-green)" : "var(--a-ink-mut)"}
            />
            <span>{t(labelKey as never)}</span>
          </Link>
        ),
      )}
    </nav>
  );
}
