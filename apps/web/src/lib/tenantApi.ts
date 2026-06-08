/**
 * @deprecated Import from `@/lib/tenant-admin` instead. Thin re-exports kept for gradual migration.
 */
export {
  getMetrics as tenantGetMetrics,
  getLoyaltyActivity as tenantGetLoyaltyActivity,
  getStats as tenantGetStats,
  listLocations as tenantListLocations,
  createLocation as tenantCreateLocation,
  setLocationHQ as tenantSetLocationHQ,
  publicListNearbyLocations,
  type TenantMetricsQuery,
  type NearbyLocationsQuery,
} from "./tenant-admin/metrics";
