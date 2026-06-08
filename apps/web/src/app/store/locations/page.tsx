"use client";

import type { TenantLocation } from "@jubely/api-schemas";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  KpiTile,
  KpiTileStrip,
} from "@jubely/ui";
import { MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { LocationAddressForm } from "@/components/store/location-address-form";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useSession } from "@/hooks/useSession";
import { useTenantLocations } from "@/hooks/useTenantMetrics";
import { tenantCreateLocation, tenantSetLocationHQ } from "@/lib/tenantApi";

function MapPlaceholder({
  locations,
  selectedId,
  onSelect,
}: {
  locations: TenantLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-[#EEE7DA]">
      <div className="absolute inset-0 opacity-70">
        <svg viewBox="0 0 800 520" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="520" fill="#EEE7DA" />
          <path
            d="M -20 380 Q 160 340 300 400 T 620 420 L 840 380 L 840 560 L -20 560 Z"
            fill="#CFE3E0"
            opacity="0.75"
          />
        </svg>
      </div>
      {locations.map((loc, index) => {
        const x = 20 + ((index * 17) % 70);
        const y = 25 + ((index * 23) % 55);
        const active = selectedId === loc.id;
        return (
          <button
            key={loc.id}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect(loc.id)}
          >
            <div
              className={
                active
                  ? "flex items-center gap-2 rounded-full bg-[#1A1610] px-3 py-1.5 text-xs font-semibold text-[#F2EBDC] shadow-lg"
                  : "flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-sm"
              }
            >
              <MapPin size={active ? 14 : 16} />
              {active ? loc.name : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function OrgLocationsPage() {
  const t = useTranslations("store.locations");
  const { headerContext } = useMerchantLocationScope();
  const { session } = useSession();
  const locationsQuery = useTenantLocations();
  const [error, setError] = useState<string | null>(null);
  const [settingHQ, setSettingHQ] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = useCallback(async () => {
    await locationsQuery.refetch();
  }, [locationsQuery]);

  const locations = useMemo(
    () => locationsQuery.data ?? [],
    [locationsQuery.data],
  );
  const selected = useMemo(
    () => locations.find((loc) => loc.id === selectedId) ?? locations[0] ?? null,
    [locations, selectedId],
  );

  async function createLocation(values: {
    name: string;
    slug: string;
    countryCode: string;
    stateCode: string;
    city: string;
    addressLine: string;
    lat?: number;
    lng?: number;
    timezone: string;
  }) {
    if (!session?.tenantId) return;
    setError(null);
    await tenantCreateLocation(session.tenantId, {
      name: values.name,
      slug: values.slug,
      country_code: values.countryCode,
      state_code: values.stateCode || undefined,
      city: values.city,
      address_line: values.addressLine || undefined,
      lat: values.lat,
      lng: values.lng,
      status: "open",
      timezone: values.timezone,
    });
    await reload();
    setCreateOpen(false);
  }

  async function markHeadquarters(locationId: string) {
    if (!session?.tenantId) return;
    setError(null);
    setSettingHQ(locationId);
    try {
      await tenantSetLocationHQ(session.tenantId, locationId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("setHeadquartersError"));
    } finally {
      setSettingHQ(null);
    }
  }

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" className="gap-1.5">
              <Plus size={14} />
              {t("form.submit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("form.title")}</DialogTitle>
            </DialogHeader>
            <LocationAddressForm
              submitLabel={t("form.submit")}
              onSubmit={async (values) => {
                try {
                  await createLocation(values);
                } catch (err) {
                  setError(err instanceof Error ? err.message : t("form.errorGeneric"));
                  throw err;
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <KpiTileStrip>
        <KpiTile label={t("kpiActive")} value={locations.length} tone="emerald" />
        <KpiTile
          label={t("kpiOpen")}
          value={locations.filter((l) => l.status === "open").length}
          tone="gold"
        />
      </KpiTileStrip>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("mapTitle")}</CardTitle>
            <CardDescription>{t("mapDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {locationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : (
              <MapPlaceholder
                locations={locations}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detailTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-2xl font-medium italic">{selected.name}</h3>
                    {selected.is_hq ? <Badge>{t("hqBadge")}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.city}, {selected.country_code}
                  </p>
                  {selected.address_line ? (
                    <p className="text-sm text-muted-foreground">{selected.address_line}</p>
                  ) : null}
                </div>
                {!selected.is_hq ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={settingHQ === selected.id}
                    onClick={() => markHeadquarters(selected.id)}
                  >
                    {settingHQ === selected.id ? t("setHeadquartersLoading") : t("setHeadquarters")}
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MerchantPageShell>
  );
}
