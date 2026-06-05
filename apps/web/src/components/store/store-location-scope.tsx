"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@jubely/ui";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { selectMerchantActiveLocation } from "@/lib/storeLocationScope";

type StoreLocationScopeProps = {
  className?: string;
  compact?: boolean;
};

export function StoreLocationScope({ className, compact }: StoreLocationScopeProps) {
  const t = useTranslations("store.shell");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { session, locations, activeLocation, sidebarLocationLabel } = useMerchantLocationScope();

  if (!sidebarLocationLabel || !locations?.length) {
    return null;
  }

  const membershipId = session?.membershipId;
  if (!membershipId) {
    return (
      <p className={cn("truncate text-xs text-muted-foreground", className)}>{sidebarLocationLabel}</p>
    );
  }

  const mid = membershipId;

  function pick(locationId: string | null) {
    startTransition(async () => {
      await selectMerchantActiveLocation(mid, locationId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 rounded-md text-left text-xs text-muted-foreground transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          compact && "justify-center",
          className,
        )}
      >
        <span className="truncate">{sidebarLocationLabel}</span>
        {!compact ? <ChevronDown className="size-3.5 shrink-0 opacity-60" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("scopeMenuTitle")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => pick(null)} className="flex items-center justify-between gap-2">
          <span>{t("allLocations")}</span>
          {!activeLocation ? <Check className="size-4 shrink-0" /> : null}
        </DropdownMenuItem>
        {locations.map((loc) => (
          <DropdownMenuItem
            key={loc.id}
            onClick={() => pick(loc.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{loc.name}</span>
            {activeLocation?.id === loc.id ? <Check className="size-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
