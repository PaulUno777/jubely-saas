"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@jubely/ui";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalSearchContext } from "@/components/layout/portal-search-provider";

const STORE_ROUTES = [
  { href: "/store", key: "items.overview" },
  { href: "/store/customers", key: "items.customers", searchable: true },
  { href: "/store/transactions", key: "items.transactions", searchable: true },
  { href: "/store/analytics", key: "items.analytics" },
  { href: "/store/locations", key: "items.locations" },
  { href: "/store/agents", key: "items.teamAgents", searchable: true },
  { href: "/store/points-rules", key: "items.pointsRules" },
  { href: "/store/rewards", key: "items.rewards" },
  { href: "/store/enrollment-qr", key: "items.enrollmentQr" },
  { href: "/store/campaigns", key: "items.campaigns" },
  { href: "/store/settings", key: "items.settings" },
  { href: "/store/subscription", key: "items.subscription" },
] as const;

export function StoreCommandMenu() {
  const t = useTranslations("store.commandMenu");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const { commandOpen, setCommandOpen, focusSearch, registration } = usePortalSearchContext();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STORE_ROUTES.filter((route) => {
      const label = tNav(route.key).toLowerCase();
      return !q || label.includes(q) || route.href.includes(q);
    });
  }, [query, tNav]);

  const close = useCallback(() => {
    setCommandOpen(false);
    setQuery("");
  }, [setCommandOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);

  const runAction = (action: () => void) => {
    action();
    close();
  };

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {registration?.enabled ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => runAction(focusSearch)}
            >
              <Search className="size-4 text-muted-foreground" />
              <span>{t("searchCurrentPage")}</span>
            </button>
          ) : null}
          {items.map((route) => (
            <button
              key={route.href}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => runAction(() => router.push(route.href))}
            >
              <span>{tNav(route.key)}</span>
              <span className="text-xs text-muted-foreground">{route.href}</span>
            </button>
          ))}
          {!items.length ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
