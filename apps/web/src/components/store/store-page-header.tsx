"use client";

import { Button, cn } from "@jubely/ui";
import { Bell, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

type StorePageHeaderProps = {
  title: string;
  context?: string;
};

export function StorePageHeader({ title, context }: StorePageHeaderProps) {
  const t = useTranslations("store.home");
  const queryClient = useQueryClient();

  const refreshDashboard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["tenant"] });
  }, [queryClient]);

  return (
    <PortalPageHeader
      title={title}
      context={context}
      searchPlaceholder={t("searchPlaceholder")}
      className="merchant-portal-header"
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="jb-icon-btn size-9 rounded-[10px] bg-secondary"
            aria-label={t("refresh")}
            onClick={refreshDashboard}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("jb-icon-btn relative size-9 rounded-[10px] bg-secondary")}
            aria-label={t("notifications")}
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive ring-2 ring-background" />
          </Button>
        </>
      }
    />
  );
}
