export * from "./core";
export * as tenantCustomers from "./customers";
export * as tenantTransactions from "./transactions";
export * as tenantAgents from "./agents";
export * as tenantSettings from "./settings";
export * as tenantRewards from "./rewards";
export * as tenantRules from "./rules";
export * as tenantCampaigns from "./campaigns";
export * as tenantAnalytics from "./analytics";
export * as tenantQR from "./qr-branding";
export * as tenantMetrics from "./metrics";

// Convenience re-exports for common call sites
export { listCustomers, getCustomer, adjustCustomerPoints } from "./customers";
export { listTransactions } from "./transactions";
export { listAgents, createInvitation } from "./agents";
export { getSettings, patchSettings, getLocales, putLocales } from "./settings";
export { listRewards, createReward, patchReward, uploadRewardImage } from "./rewards";
export {
  listRules,
  createRule,
  patchRule,
  simulateRules,
  validateRules,
  listTiers,
  upsertTier,
} from "./rules";
export {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  launchCampaign,
  pauseCampaign,
} from "./campaigns";
export {
  getOverview,
  getMemberGrowth,
  getTierDistribution,
  getHeatmap,
  getTopRewards,
  getRetention,
} from "./analytics";
export { getQRBranding, putQRBranding, getQRToken, qrRenderSvgUrl } from "./qr-branding";
export {
  getMetrics,
  getLoyaltyActivity,
  getStats,
  listLocations,
  createLocation,
  setLocationHQ,
  publicListNearbyLocations,
  type TenantMetricsQuery,
  type NearbyLocationsQuery,
} from "./metrics";
