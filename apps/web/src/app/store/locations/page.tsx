"use client";

import type { TenantLocation } from "@jubely/api-schemas";
import { Button } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { LocationAddressForm } from "@/components/store/location-address-form";
import { useSession } from "@/hooks/useSession";
import { useTenantLocations } from "@/hooks/useTenantMetrics";
import { tenantCreateLocation, tenantSetLocationHQ } from "@/lib/tenantApi";

export default function OrgLocationsPage() {
  const t = useTranslations("store.locations");
  const { session } = useSession();
  const locationsQuery = useTenantLocations();
  const [error, setError] = useState<string | null>(null);
  const [settingHQ, setSettingHQ] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await locationsQuery.refetch();
  }, [locationsQuery]);

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

  const locations = locationsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {locationsQuery.isError ? (
        <p className="text-destructive text-sm">{t("loadError")}</p>
      ) : null}
      <ul className="space-y-2">
        {locations.map((loc: TenantLocation) => (
          <li key={loc.id} className="rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {loc.name}
                  {loc.is_hq ? (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      · {t("hqBadge")}
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loc.city}, {loc.country_code} · {loc.status}
                </p>
              </div>
              {!loc.is_hq ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={settingHQ === loc.id}
                  onClick={() => markHeadquarters(loc.id)}
                >
                  {settingHQ === loc.id ? t("setHeadquartersLoading") : t("setHeadquarters")}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
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
    </div>
  );
}
