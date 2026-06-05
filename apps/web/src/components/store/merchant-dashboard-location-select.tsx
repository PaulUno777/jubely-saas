"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { selectMerchantActiveLocation } from "@/lib/storeLocationScope";

export function MerchantDashboardLocationSelect() {
  const t = useTranslations("store.shell");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { session, locations, activeLocation } = useMerchantLocationScope();

  const membershipId = session?.membershipId ?? "";
  if (!locations?.length || !membershipId) {
    return null;
  }

  const value = activeLocation?.id ?? "all";

  function onChange(next: string) {
    const locationId = next === "all" ? null : next;
    startTransition(async () => {
      await selectMerchantActiveLocation(membershipId, locationId);
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-[min(12rem,40vw)] shrink-0 bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allLocations")}</SelectItem>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
