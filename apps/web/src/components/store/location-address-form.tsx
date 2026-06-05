"use client";

import { Country, State, City } from "country-state-city";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export type LocationAddressValues = {
  name: string;
  slug: string;
  countryCode: string;
  stateCode: string;
  city: string;
  addressLine: string;
  lat?: number;
  lng?: number;
  timezone: string;
};

type LocationAddressFormProps = {
  initialCountryCode?: string;
  submitLabel: string;
  onSubmit: (values: LocationAddressValues) => Promise<void>;
};

export function LocationAddressForm({
  initialCountryCode = "CM",
  submitLabel,
  onSubmit,
}: LocationAddressFormProps) {
  const t = useTranslations("store.locations.form");
  const locale = useLocale();
  const countryNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: "region" }),
    [locale],
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode) ?? [];
  const cities =
    stateCode !== ""
      ? (City.getCitiesOfState(countryCode, stateCode) ?? [])
      : (City.getCitiesOfCountry(countryCode) ?? []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSubmit({
        name,
        slug,
        countryCode,
        stateCode,
        city,
        addressLine,
        timezone: "Africa/Douala",
      });
      setName("");
      setSlug("");
      setAddressLine("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">{t("title")}</h2>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <input
        className="w-full rounded border px-3 py-2"
        placeholder={t("name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="w-full rounded border px-3 py-2"
        placeholder={t("slug")}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
      />
      <select
        className="w-full rounded border px-3 py-2"
        value={countryCode}
        onChange={(e) => {
          setCountryCode(e.target.value);
          setStateCode("");
          setCity("");
        }}
      >
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {countryNames.of(c.isoCode) ?? c.name}
          </option>
        ))}
      </select>
      {states.length > 0 ? (
        <select
          className="w-full rounded border px-3 py-2"
          value={stateCode}
          onChange={(e) => {
            setStateCode(e.target.value);
            setCity("");
          }}
        >
          <option value="">{t("state")}</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}
      <select
        className="w-full rounded border px-3 py-2"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
      >
        <option value="">{t("city")}</option>
        {cities.map((c) => (
          <option key={`${c.name}-${c.stateCode ?? ""}`} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded border px-3 py-2"
        placeholder={t("address")}
        value={addressLine}
        onChange={(e) => setAddressLine(e.target.value)}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
