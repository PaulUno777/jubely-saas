import type {
  NearbyLocations,
  TenantLoyaltyActivity,
  TenantLocation,
  TenantMetrics,
  TenantNavStats,
} from "@jubely/api-schemas";
import {
  nearbyLocationsSuccessEnvelopeSchema,
  parseJsonUnknown,
  parseSuccessData,
  tenantLoyaltyActivitySuccessEnvelopeSchema,
  tenantLocationSchema,
  tenantLocationsListSuccessEnvelopeSchema,
  tenantMetricsSuccessEnvelopeSchema,
  tenantNavStatsSuccessEnvelopeSchema,
  successEnvelopeSchema,
  throwFailedApiResponse,
} from "@jubely/api-schemas";
import { authedFetch, joinUrlWithQuery } from "@/lib/http";

const singleLocationEnvelopeSchema = successEnvelopeSchema(tenantLocationSchema);

export type TenantMetricsQuery = {
  tenantId: string;
  period?: "7d" | "30d";
  locationId?: string;
};

async function tenantFetchData<T>(
  path: string,
  schema: Parameters<typeof parseSuccessData<T>>[1],
): Promise<T> {
  const res = await authedFetch(path, { method: "GET" });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, schema, res.status, text);
}

export async function tenantGetMetrics(input: TenantMetricsQuery): Promise<TenantMetrics> {
  return tenantFetchData(
    joinUrlWithQuery(`/v1/tenants/${encodeURIComponent(input.tenantId)}/metrics`, {
      period: input.period ?? "7d",
      location_id: input.locationId,
    }),
    tenantMetricsSuccessEnvelopeSchema,
  );
}

export async function tenantGetLoyaltyActivity(
  input: TenantMetricsQuery,
): Promise<TenantLoyaltyActivity> {
  return tenantFetchData(
    joinUrlWithQuery(
      `/v1/tenants/${encodeURIComponent(input.tenantId)}/metrics/loyalty-activity`,
      {
        period: input.period ?? "7d",
        location_id: input.locationId,
      },
    ),
    tenantLoyaltyActivitySuccessEnvelopeSchema,
  );
}

export async function tenantGetStats(tenantId: string): Promise<TenantNavStats> {
  return tenantFetchData(
    `/v1/tenants/${encodeURIComponent(tenantId)}/stats`,
    tenantNavStatsSuccessEnvelopeSchema,
  );
}

export async function tenantListLocations(tenantId: string): Promise<TenantLocation[]> {
  const data = await tenantFetchData(
    `/v1/tenants/${encodeURIComponent(tenantId)}/locations`,
    tenantLocationsListSuccessEnvelopeSchema,
  );
  return data.locations;
}

export async function tenantCreateLocation(
  tenantId: string,
  body: {
    name: string;
    slug: string;
    country_code: string;
    state_code?: string;
    city: string;
    address_line?: string;
    lat?: number;
    lng?: number;
    status?: string;
    timezone?: string;
  },
): Promise<TenantLocation> {
  const res = await authedFetch(`/v1/tenants/${encodeURIComponent(tenantId)}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleLocationEnvelopeSchema, res.status, text);
}

export async function tenantSetLocationHQ(
  tenantId: string,
  locationId: string,
): Promise<TenantLocation> {
  const res = await authedFetch(
    `/v1/tenants/${encodeURIComponent(tenantId)}/locations/${encodeURIComponent(locationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hq: true }),
    },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, singleLocationEnvelopeSchema, res.status, text);
}

export type NearbyLocationsQuery = {
  lat?: number;
  lng?: number;
  country_code?: string;
  city?: string;
  radius_km?: number;
  limit?: number;
};

export async function publicListNearbyLocations(
  query: NearbyLocationsQuery,
): Promise<NearbyLocations> {
  const res = await fetch(
    joinUrlWithQuery("/api/v1/public/locations/nearby", {
      lat: query.lat,
      lng: query.lng,
      country_code: query.country_code,
      city: query.city,
      radius_km: query.radius_km,
      limit: query.limit,
    }),
    { method: "GET", credentials: "include" },
  );
  const text = await res.text();
  const json = parseJsonUnknown(text);
  if (!res.ok) throwFailedApiResponse(json, res.status, text);
  return parseSuccessData(json, nearbyLocationsSuccessEnvelopeSchema, res.status, text);
}
