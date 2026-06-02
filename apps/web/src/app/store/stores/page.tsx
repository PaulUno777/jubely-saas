"use client";

import { useEffect, useState } from "react";
import { Country, City } from "country-state-city";
import { authedJson } from "@/lib/http";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  city: string;
  status: string;
  is_hq: boolean;
};

export default function OrgStoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [countryCode, setCountryCode] = useState("CM");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const countries = Country.getAllCountries();
  const cities = City.getCitiesOfCountry(countryCode) ?? [];

  async function load() {
    const res = await authedJson<{ stores: StoreRow[] }>("/v1/organizations/me/stores");
    setStores(res.stores ?? []);
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await authedJson("/v1/organizations/me/stores", {
        method: "POST",
        json: {
          name,
          slug,
          country_code: countryCode,
          city,
          address_line: address,
          status: "open",
        },
      });
      setName("");
      setSlug("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Boutiques</h1>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <ul className="space-y-2">
        {stores.map((s) => (
          <li key={s.id} className="rounded-lg border px-4 py-3">
            <p className="font-medium">
              {s.name}
              {s.is_hq ? " · HQ" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {s.city}, {s.country_code} · {s.status}
            </p>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => void createStore(e)} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Nouvelle boutique</h2>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <select
          className="w-full rounded border px-3 py-2"
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            setCity("");
          }}
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} required>
          <option value="">Ville</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Créer
        </button>
      </form>
    </div>
  );
}
