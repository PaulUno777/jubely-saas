import type {
  NearbyLocations,
  TenantLoyaltyActivity,
  TenantLocation,
  TenantMetrics,
  TenantNavStats,
} from "@jubely/api-schemas";
import {
  nearbyLocationsSuccessEnvelopeSchema,
  tenantLocationSchema,
  tenantLocationsListSuccessEnvelopeSchema,
  tenantLoyaltyActivitySuccessEnvelopeSchema,
  tenantMetricsSuccessEnvelopeSchema,
  tenantNavStatsSuccessEnvelopeSchema,
  successEnvelopeSchema,
} from "@jubely/api-schemas";
import { joinUrlWithQuery } from "@/lib/http";
import { buildTenantPath, jsonPatch, jsonPost, tenantFetch, tenantMutate } from "./core";

const singleLocationEnvelopeSchema = successEnvelopeSchema(tenantLocationSchema);

export type TenantMetricsQuery = {
  tenantId: string;
  period?: "7d" | "30d";
  from?: string;
  to?: string;
  locationId?: string;
};

function metricsQuery(input: TenantMetricsQuery) {
  const q: Record<string, string | undefined> = {
    location_id: input.locationId,
  };
  if (input.from && input.to) {
    q.from = input.from;
    q.to = input.to;
  } else {
    q.period = input.period ?? "7d";
  }
  return q;
}

export async function getMetrics(input: TenantMetricsQuery): Promise<TenantMetrics> {
  return tenantFetch(
    joinUrlWithQuery(buildTenantPath(input.tenantId, "metrics"), metricsQuery(input)),
    tenantMetricsSuccessEnvelopeSchema,
  );
}

export async function getLoyaltyActivity(
  input: TenantMetricsQuery,
): Promise<TenantLoyaltyActivity> {
  return tenantFetch(
    joinUrlWithQuery(
      buildTenantPath(input.tenantId, "metrics/loyalty-activity"),
      metricsQuery(input),
    ),
    tenantLoyaltyActivitySuccessEnvelopeSchema,
  );
}

export async function getStats(tenantId: string): Promise<TenantNavStats> {
  return tenantFetch(buildTenantPath(tenantId, "stats"), tenantNavStatsSuccessEnvelopeSchema);
}

export async function listLocations(tenantId: string): Promise<TenantLocation[]> {
  const data = await tenantFetch(
    buildTenantPath(tenantId, "locations"),
    tenantLocationsListSuccessEnvelopeSchema,
  );
  return data.locations;
}

export async function createLocation(
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
  return tenantMutate(
    buildTenantPath(tenantId, "locations"),
    singleLocationEnvelopeSchema,
    jsonPost(body),
  );
}

export async function setLocationHQ(
  tenantId: string,
  locationId: string,
): Promise<TenantLocation> {
  return tenantMutate(
    buildTenantPath(tenantId, `locations/${encodeURIComponent(locationId)}`),
    singleLocationEnvelopeSchema,
    jsonPatch({ is_hq: true }),
  );
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
  const { parseJsonUnknown, parseSuccessData, throwFailedApiResponse } = await import(
    "@jubely/api-schemas"
  );
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
