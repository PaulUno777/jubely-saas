"use client";

import { Button, Input } from "@jubely/ui";
import { Bell, Plus, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";

type StorePageHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StorePageHeader({ title, actionLabel, onAction }: StorePageHeaderProps) {
  const t = useTranslations("store.home");
  const format = useFormatter();
  const today = format.dateTime(new Date(), { dateStyle: "full" });

  return (
    <Header fixed>
      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{today}</p>
        </div>
        <div className="flex flex-1 items-center gap-2 lg:max-w-xl lg:justify-end">
          <div className="relative hidden min-w-0 flex-1 md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 bg-background/80 pl-9" placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          </div>
          <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={t("notifications")}>
            <Bell className="size-4" />
          </Button>
          {actionLabel ? (
            <Button type="button" size="sm" className="shrink-0 gap-1.5" onClick={onAction}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{actionLabel}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </Header>
  );
}
