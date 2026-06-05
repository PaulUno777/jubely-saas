#!/usr/bin/env node
/**
 * Local dev seed for dashboards, store admin, agent, and customer portals.
 *
 * Seeds:
 * - superadmin + organizations (each new org gets HQ store `main` + Growth trialing subscription)
 * - Chez Mama: activate MoMo subscription, then extra boutiques via POST /organizations/me/stores
 * - separate single-store orgs for multi-workspace agent demo
 * - org-wide rules + rewards via /v1/tenants/:id/*; purchases tagged per boutique
 * - 15 days of backdated purchase activity (occurred_at) for charts / analytics
 * - pooled loyalty: one enrollment per org; OTP claim + staff validation on primary org
 * - tenant admin smoke: settings, stats, metrics, customers, transactions, analytics, QR
 *
 * Requires API running; backend/.env needs BOOTSTRAP_SECRET.
 * For automated customer login: PUBLIC_OTP_DEV_CODE=000000 (see backend/.env.example).
 *
 * Optional env: API_BASE, SEED_ACTIVITY_DAYS, SEED_RANDOM_SEED, DEV_OTP_CODE, etc.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  api,
  asArray,
  asObject,
  data,
  env,
  loginScoped,
  requireString,
  resolveApiBase,
  metricsKpiValue,
  tenantAdminSmoke,
  tenantCreateCampaign,
  tenantCreateReward,
  tenantCreateRule,
  tenantGetMetrics,
  tenantGetQrToken,
  tenantListCampaigns,
  tenantListCustomers,
  tenantListRewards,
  tenantListRules,
  tenantPatchSettings,
  waitForApi,
} from "./lib/dev-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = process.env.ENV_FILE ?? join(ROOT, "backend", ".env");

const config = {
  apiBase: resolveApiBase(ENV_FILE),
  bootstrapSecret: env("BOOTSTRAP_SECRET", "", ENV_FILE),
  publicEnrollRequirePhoneVerify: env("PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY", "", ENV_FILE) === "true",
  devOtpCode: env("DEV_OTP_CODE", env("PUBLIC_OTP_DEV_CODE", "000000", ENV_FILE), ENV_FILE),
  superEmail: env("SUPER_EMAIL", "super@jubely.local", ENV_FILE),
  superPassword: env("SUPER_PASSWORD", "SuperAdmin123!", ENV_FILE),
  tenantName: env("TENANT_NAME", "Chez Mama", ENV_FILE),
  tenantSlug: env("TENANT_SLUG", "chez-mama", ENV_FILE),
  merchantEmail: env("MERCHANT_EMAIL", "merchant@chezmama.local", ENV_FILE),
  merchantPassword: env("MERCHANT_PASSWORD", "MerchantAdmin123!", ENV_FILE),
  agentEmail: env("AGENT_EMAIL", "agent.multi@jubely.local", ENV_FILE),
  agentPassword: env("AGENT_PASSWORD", "AgentStaff123!", ENV_FILE),
  customerName: env("CUSTOMER_NAME", "Awa Diop", ENV_FILE),
  customerPhone: env("CUSTOMER_PHONE", "+237611111111", ENV_FILE),
  customerEmail: env("CUSTOMER_EMAIL", "awa@example.com", ENV_FILE),
  customerPhoneVerifyToken: env("CUSTOMER_PHONE_VERIFY_TOKEN", "", ENV_FILE),
  workerCustomerPhone: env("WORKER_CUSTOMER_PHONE", "+237622222222", ENV_FILE),
  workerCustomerName: env("WORKER_CUSTOMER_NAME", "Mireille Workspace", ENV_FILE),
  workerCustomerPhoneVerifyToken: env("WORKER_CUSTOMER_PHONE_VERIFY_TOKEN", "", ENV_FILE),
  purchaseAmountFcfa: Number(env("PURCHASE_AMOUNT_FCFA", "4500", ENV_FILE)),
  seedActivityDays: Math.max(1, Number(env("SEED_ACTIVITY_DAYS", "15", ENV_FILE))),
  seedRandomSeed: env("SEED_RANDOM_SEED", "jubely-dev", ENV_FILE),
  webOrigin: env("WEB_ORIGIN", "http://localhost:3000", ENV_FILE),
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const SEED_PURCHASE_AMOUNTS_FCFA = [
  850, 1200, 1500, 1800, 2200, 2500, 2800, 3200, 3500, 3900, 4500, 5200, 6200, 6800, 7800, 8500,
  9800, 11200, 12500, 15600,
];

const SEED_WALK_IN_CUSTOMERS = [
  { name: "Jean Kouam", phone: "+237633333331" },
  { name: "Fatou Njoya", phone: "+237644444442" },
  { name: "Sandrine Tchoumi", phone: "+237655555551" },
  { name: "Eric Fouda", phone: "+237666666662" },
  { name: "Nadine Abena", phone: "+237677777773" },
  { name: "Patrick Essomba", phone: "+237688888884" },
];

/** Deterministic PRNG for reproducible demo data. */
function mulberry32(seed) {
  let state = 0;
  for (const ch of String(seed)) {
    state = (state + ch.charCodeAt(0)) | 0;
  }
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Last N calendar days ending today (oldest first). */
function buildSeedActivityDays(count) {
  const days = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    days.push(day);
  }
  return days;
}

/** Random timestamp on a calendar day, clamped so it is never in the future. */
function randomOccurredAt(dayDate, rng) {
  const now = new Date();
  const dt = new Date(dayDate);
  const isToday = dayDate.toDateString() === now.toDateString();
  const lunchRush = rng() > 0.45;
  const dinnerRush = !lunchRush && rng() > 0.4;
  let hour;
  if (lunchRush) {
    hour = 11 + Math.floor(rng() * 3);
  } else if (dinnerRush) {
    hour = 17 + Math.floor(rng() * 3);
  } else {
    hour = 8 + Math.floor(rng() * 13);
  }
  if (isToday) {
    hour = Math.min(hour, Math.max(8, now.getHours() - 1));
  }
  dt.setHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
  if (dt.getTime() > now.getTime() - 60_000) {
    dt.setTime(now.getTime() - 60_000 - Math.floor(rng() * 3_600_000));
  }
  return dt.toISOString();
}

function formatDayLabel(iso) {
  return iso.slice(0, 10);
}

function isWeekendDay(dayDate) {
  const dow = dayDate.getDay();
  return dow === 0 || dow === 5 || dow === 6;
}

function transactionsForDay(dayDate, richDemo, rng) {
  if (!richDemo) {
    return 1 + (rng() > 0.5 ? 1 : 0);
  }
  const weekend = isWeekendDay(dayDate);
  return weekend ? 4 + Math.floor(rng() * 5) : 2 + Math.floor(rng() * 4);
}

/**
 * @param {{ richDemo?: boolean; includeSharedAgent?: boolean; slug?: string }} org
 * @param {OrgStoreRow[]} orgStores
 * @param {Array<{ name: string; phone: string; customer_qr?: string }>} customers
 * @param {Date[]} activityDays
 * @param {() => number} rng
 */
function buildSeedPurchasePlan(org, orgStores, customers, activityDays, rng) {
  /** @type {Array<{ day: Date; boutique: OrgStoreRow; customer: { name: string; phone: string; customer_qr?: string }; amount: number; occurredAt: string; useAgent: boolean }>} */
  const plan = [];
  for (const day of activityDays) {
    const txCount = transactionsForDay(day, Boolean(org.richDemo), rng);
    for (let i = 0; i < txCount; i++) {
      const boutique = pickRandom(rng, orgStores);
      const customer = pickRandom(rng, customers);
      plan.push({
        day,
        boutique,
        customer,
        amount: pickRandom(rng, SEED_PURCHASE_AMOUNTS_FCFA),
        occurredAt: randomOccurredAt(day, rng),
        useAgent: Boolean(org.includeSharedAgent) && rng() > 0.38,
      });
    }
  }
  plan.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return plan;
}

/** Design-aligned rule presets (admin simulator). */
function pilotRulesForStore(storeSlug) {
  const rules = [
    {
      id: `${storeSlug}-std`,
      name: "Achat standard",
      tag: "Base",
      on: true,
      trigger: "transaction",
      cond: { days: ALL_DAYS, tier: "all", minAmount: 0 },
      action: { type: "rate", per: 100, pts: 1 },
    },
    {
      id: `${storeSlug}-hh`,
      name: "Happy hour",
      tag: "Multiplicateur",
      on: storeSlug === "main" || storeSlug === config.tenantSlug,
      trigger: "transaction",
      cond: { days: [0, 1, 2, 3, 4], hours: [17, 19], tier: "all", minAmount: 0 },
      action: { type: "mult", factor: 2 },
    },
    {
      id: `${storeSlug}-first`,
      name: "Première visite",
      tag: "Bonus",
      on: storeSlug === "main" || storeSlug === config.tenantSlug,
      trigger: "enroll",
      cond: { days: ALL_DAYS, tier: "new", minAmount: 0 },
      action: { type: "flat", pts: 50 },
    },
  ];
  return rules;
}

/** Reward catalog rows per store (point costs tuned for demo balances). */
function pilotRewardsForStore(storeSlug) {
  const base = [
    { name: "Boisson offerte", description: "Jus ou café maison", point_cost: 80, min_tier: "bronze" },
    { name: "Dessert gratuit", description: "Dessert du jour", point_cost: 150, min_tier: "bronze" },
    { name: "Réduction 10%", description: "Sur la prochaine note", point_cost: 300, min_tier: "silver" },
  ];
  if (storeSlug === "main" || storeSlug === config.tenantSlug) {
    base.push({
      name: "Menu découverte",
      description: "Entrée + plat signature",
      point_cost: 500,
      min_tier: "gold",
      stock_limit: 20,
    });
  }
  return base;
}

/** @typedef {{ slug: string; name: string; city?: string; country_code?: string; address_line?: string; lat?: number; lng?: number }} BoutiqueDef */

/** Organizations (tenants) and optional extra boutiques under the same org. */
const organizations = [
  {
    name: config.tenantName,
    slug: config.tenantSlug,
    plan: "growth",
    merchantEmail: config.merchantEmail,
    merchantPassword: config.merchantPassword,
    purchaseAmountFcfa: config.purchaseAmountFcfa,
    extraPurchases: [2200, 3100],
    includeSharedAgent: true,
    richDemo: true,
    /** Trial allows 1 store; confirm MoMo to unlock Growth max_stores (3). */
    activateBilling: true,
    boutiques: /** @type {BoutiqueDef[]} */ ([
      {
        slug: "akwa",
        name: "Chez Mama — Akwa",
        city: "Douala",
        country_code: "CM",
        address_line: "Akwa",
        lat: 4.0511,
        lng: 9.7085,
      },
      {
        slug: "bonapriso",
        name: "Chez Mama — Bonapriso",
        city: "Douala",
        country_code: "CM",
        address_line: "Bonapriso",
        lat: 4.0483,
        lng: 9.7044,
      },
    ]),
  },
  {
    name: "Maison Naka",
    slug: "maison-naka",
    plan: "starter",
    merchantEmail: "merchant.maison-naka@jubely.local",
    merchantPassword: "MerchantMaison123!",
    purchaseAmountFcfa: 6200,
    extraPurchases: [1500],
    includeSharedAgent: true,
    richDemo: false,
    activateBilling: false,
    boutiques: [],
  },
  {
    name: "Bantu Coffee",
    slug: "bantu-coffee",
    plan: "starter",
    merchantEmail: "merchant.bantu-coffee@jubely.local",
    merchantPassword: "MerchantBantu123!",
    purchaseAmountFcfa: 7800,
    extraPurchases: [],
    includeSharedAgent: true,
    richDemo: false,
    activateBilling: false,
    boutiques: [],
  },
];

const extraStaffCustomers = SEED_WALK_IN_CUSTOMERS.slice(0, 2);

function log(step) {
  console.log(`-> ${step}`);
}

/**
 * @typedef {{ tenant_id?: string; name?: string; slug?: string }} TenantRow
 * @typedef {{ id?: string; slug?: string; name?: string; is_hq?: boolean }} OrgStoreRow
 * @typedef {{ membership_id?: string; tenant_slug?: string; tenant_name?: string; role?: string }} WorkspaceRow
 * @typedef {{ enrollment_id?: string; phone?: string; name?: string; points_balance?: number; customer_qr?: string }} StoreCustomerRow
 */

/** @param {string} method @param {string} path @param {object} [opts] */
function callApi(method, path, opts = {}) {
  return api(config.apiBase, method, path, opts);
}

/** Default earn rule: 1 pt / 100 FCFA (matches rule engine). */
function pointsForAmount(amountFcfa) {
  return Math.floor(amountFcfa / 100);
}

async function waitForApiReady() {
  log(`Health check ${config.apiBase}/health`);
  try {
    await waitForApi(config.apiBase);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    console.error("Tip: docker compose up backend  or  cd backend && go run ./cmd/api");
    process.exit(1);
  }
}

async function inviteAndAccept(auth, email, role, password, invPath) {
  const inv = await callApi("POST", invPath, {
    headers: { authorization: `Bearer ${auth}` },
    body: { email, role },
  });
  const token = requireString(asObject(data(inv.json), `invite ${email}`).token, `invite token for ${email}`);
  await callApi("POST", `/v1/invitations/${encodeURIComponent(token)}/accept`, {
    body: { password },
  });
}

async function listTenants(superToken) {
  const list = await callApi("GET", "/v1/superadmin/tenants?limit=200", {
    headers: { authorization: `Bearer ${superToken}` },
  });
  return /** @type {TenantRow[]} */ (asArray(data(list.json)));
}

async function ensureTenant(superToken, org) {
  const plan = typeof org.plan === "string" && org.plan ? org.plan : "starter";
  const created = await callApi("POST", "/v1/superadmin/tenants", {
    allowError: true,
    headers: { authorization: `Bearer ${superToken}` },
    body: { name: org.name, slug: org.slug, plan },
  });
  const payload = data(created.json);
  if (payload && typeof payload === "object") {
    const obj = /** @type {Record<string, unknown>} */ (payload);
    const tenantId = typeof obj.tenant_id === "string" ? obj.tenant_id : typeof obj.id === "string" ? obj.id : "";
    if (tenantId) return tenantId;
  }
  const tenants = await listTenants(superToken);
  const found = tenants.find((row) => row.slug === org.slug);
  if (!found?.tenant_id) {
    throw new Error(`Could not resolve tenant id for ${org.slug}`);
  }
  return found.tenant_id;
}

async function listOrgStores(merchantToken) {
  const res = await callApi("GET", "/v1/organizations/me/stores", {
    headers: { authorization: `Bearer ${merchantToken}` },
  });
  const payload = asObject(data(res.json), "org stores");
  return /** @type {OrgStoreRow[]} */ (asArray(payload.stores));
}

async function createOrgStore(merchantToken, boutique) {
  const res = await callApi("POST", "/v1/organizations/me/stores", {
    headers: { authorization: `Bearer ${merchantToken}` },
    body: {
      slug: boutique.slug,
      name: boutique.name,
      country_code: boutique.country_code ?? "CM",
      city: boutique.city ?? "",
      address_line: boutique.address_line ?? "",
      lat: boutique.lat,
      lng: boutique.lng,
      status: "open",
    },
  });
  return asObject(data(res.json), `boutique ${boutique.slug}`);
}

async function ensureOrgBoutiques(merchantToken, boutiques) {
  let stores = await listOrgStores(merchantToken);
  const slugs = new Set(stores.map((row) => row.slug).filter(Boolean));
  for (const boutique of boutiques) {
    if (slugs.has(boutique.slug)) continue;
    log(`Add boutique ${boutique.slug} (${boutique.name})`);
    const created = await createOrgStore(merchantToken, boutique);
    stores.push({
      id: typeof created.id === "string" ? created.id : undefined,
      slug: typeof created.slug === "string" ? created.slug : boutique.slug,
      name: typeof created.name === "string" ? created.name : boutique.name,
      is_hq: created.is_hq === true,
    });
    slugs.add(boutique.slug);
  }
  return stores;
}

async function activateOrgSubscription(merchantToken) {
  const subRes = await callApi("GET", "/v1/organizations/me/subscription", {
    headers: { authorization: `Bearer ${merchantToken}` },
  });
  const sub = asObject(data(subRes.json), "subscription");
  if (sub.status === "active") {
    return;
  }
  log("Activate org subscription (dev MoMo confirm)");
  const invRes = await callApi("POST", "/v1/organizations/me/subscription/momo-invoice", {
    headers: { authorization: `Bearer ${merchantToken}` },
  });
  const inv = asObject(data(invRes.json), "momo invoice");
  const payRef = requireString(inv.pay_reference, "pay_reference");
  await callApi("POST", "/v1/organizations/me/subscription/confirm-momo", {
    headers: { authorization: `Bearer ${merchantToken}` },
    body: { pay_reference: payRef },
  });
}

async function loginScopedWithStore(email, password, tenantSlug, activeStoreId = "") {
  return loginScoped(config.apiBase, email, password, tenantSlug, activeStoreId);
}

function hqStore(stores) {
  return stores.find((row) => row.is_hq) ?? stores.find((row) => row.slug === "main") ?? stores[0];
}

function hasWorkspace(session, desiredTenantSlug) {
  if (!desiredTenantSlug) return true;
  const workspaces = /** @type {WorkspaceRow[]} */ (asArray(session.workspaces));
  return workspaces.some((row) => row.tenant_slug === desiredTenantSlug);
}

async function maybeLoginScoped(email, password, tenantSlug = "") {
  try {
    return await loginScoped(config.apiBase, email, password, tenantSlug);
  } catch {
    return null;
  }
}

async function ensureWorkspaceAccess(inviterAuthToken, email, role, password, invPath, desiredTenantSlug = "") {
  const existing = await maybeLoginScoped(email, password, desiredTenantSlug);
  if (existing && hasWorkspace(existing, desiredTenantSlug)) {
    return;
  }
  await inviteAndAccept(inviterAuthToken, email, role, password, invPath);
}

async function ensureTenantRules(authToken, tenantId, storeSlug) {
  const existing = await tenantListRules(config.apiBase, authToken, tenantId);
  if (existing.length > 0) {
    return existing.length;
  }
  let n = 0;
  for (const [i, rule] of pilotRulesForStore(storeSlug).entries()) {
    await tenantCreateRule(config.apiBase, authToken, tenantId, rule, i);
    n++;
  }
  return n;
}

async function ensureTenantRewardsCatalog(authToken, tenantId, storeSlug) {
  const existing = await tenantListRewards(config.apiBase, authToken, tenantId, false);
  if (existing.length > 0) {
    return existing;
  }
  const created = [];
  for (const row of pilotRewardsForStore(storeSlug)) {
    created.push(await tenantCreateReward(config.apiBase, authToken, tenantId, row));
  }
  return created;
}

async function ensurePilotCampaign(authToken, tenantId) {
  const existing = await tenantListCampaigns(config.apiBase, authToken, tenantId);
  if (existing.length > 0) {
    return existing[0];
  }
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  log(`[campaign] Create pilot push campaign`);
  return tenantCreateCampaign(config.apiBase, authToken, tenantId, {
    name: "Fidélité week-end",
    campaign_type: "push",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    targeting_json: { tier: "all" },
    action_json: { message: "Double points ce week-end !" },
    budget_points: 5000,
  });
}

async function ensurePwaEnrollment(merchantAuthToken, tenantId, storeQr, customer) {
  if (config.publicEnrollRequirePhoneVerify && !customer.phoneVerifyToken) {
    throw new Error(
      `PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY=true requires a phone proof token for ${customer.phone}. Set CUSTOMER_PHONE_VERIFY_TOKEN or use PUBLIC_OTP_DEV_CODE.`,
    );
  }
  const res = await callApi("POST", "/v1/public/enrollments", {
    allowError: true,
    body: {
      store_qr: storeQr,
      name: customer.name,
      phone_e164: customer.phone,
      ...(customer.email ? { email: customer.email } : {}),
      ...(customer.phoneVerifyToken ? { phone_verify_token: customer.phoneVerifyToken } : {}),
    },
  });
  if (res.res.ok) {
    return asObject(data(res.json), `pwa enroll ${customer.phone}`);
  }
  const existingRows = await tenantListCustomers(config.apiBase, merchantAuthToken, tenantId, {
    limit: 200,
  });
  const existing = existingRows.find((row) => row.phone === customer.phone);
  if (existing?.enrollment_id) {
    return {
      enrollment_id: existing.enrollment_id,
      customer_qr: existing.customer_qr,
      phone: existing.phone,
      name: existing.name,
    };
  }
  const message =
    res.json?.error?.message ??
    res.text.slice(0, 200) ??
    `could not ensure enrollment for ${customer.phone}`;
  throw new Error(String(message));
}

async function staffCreateCustomer(authToken, merchantAuthToken, tenantId, customer) {
  const res = await callApi("POST", "/v1/staff/customers", {
    allowError: true,
    headers: { authorization: `Bearer ${authToken}` },
    body: {
      name: customer.name,
      phone_e164: customer.phone,
      ...(customer.email ? { email: customer.email } : {}),
    },
  });
  if (res.res.ok) {
    return asObject(data(res.json), `staff customer ${customer.phone}`);
  }
  const existingRows = await tenantListCustomers(config.apiBase, merchantAuthToken, tenantId, {
    limit: 200,
  });
  const existing = existingRows.find((row) => row.phone === customer.phone);
  if (existing?.enrollment_id) {
    return { enrollment_id: existing.enrollment_id, customer_qr: "" };
  }
  const message = res.json?.error?.message ?? res.text.slice(0, 200);
  throw new Error(`POST /v1/staff/customers failed (${res.res.status}): ${message}`);
}

async function recordPurchase(authToken, { phone, customerQr, amountFcfa, occurredAt }) {
  const res = await callApi("POST", "/v1/staff/purchases", {
    headers: { authorization: `Bearer ${authToken}` },
    body: {
      ...(phone ? { phone_e164: phone } : {}),
      ...(customerQr ? { customer_qr: customerQr } : {}),
      amount_fcfa: amountFcfa,
      ...(occurredAt ? { occurred_at: occurredAt } : {}),
    },
  });
  return asObject(data(res.json), `purchase ${phone ?? customerQr ?? amountFcfa}`);
}

async function otpSend(phone) {
  await callApi("POST", "/v1/public/otp/send", { body: { phone_e164: phone } });
}

async function otpVerify(phone, code) {
  const res = await callApi("POST", "/v1/public/otp/verify", {
    body: { phone_e164: phone, code },
  });
  const payload = asObject(data(res.json), "otp verify");
  return requireString(payload.phone_verify_token, "phone_verify_token");
}

async function resolvePhoneVerifyToken(phone, explicitToken = "") {
  if (explicitToken) return explicitToken;
  if (!config.devOtpCode) {
    throw new Error(
      `No phone_verify_token for ${phone}. Set CUSTOMER_PHONE_VERIFY_TOKEN or PUBLIC_OTP_DEV_CODE=000000 in backend/.env and DEV_OTP_CODE in seed.`,
    );
  }
  await otpSend(phone);
  return otpVerify(phone, config.devOtpCode);
}

async function customerLogin(phoneVerifyToken) {
  const res = await callApi("POST", "/v1/auth/customer/login", {
    body: { phone_verify_token: phoneVerifyToken },
  });
  return asObject(data(res.json), "customer login");
}

async function customerSelectSession(accessToken, enrollmentId) {
  const res = await callApi("POST", "/v1/auth/customer/session", {
    headers: { authorization: `Bearer ${accessToken}` },
    body: { enrollment_id: enrollmentId },
  });
  return asObject(data(res.json), "customer session");
}

async function customerListRewards(accessToken) {
  const res = await callApi("GET", "/v1/customers/me/rewards", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return asObject(data(res.json), "customer rewards");
}

async function customerClaimReward(accessToken, rewardId) {
  const res = await callApi("POST", `/v1/customers/me/rewards/${encodeURIComponent(rewardId)}/claims`, {
    headers: { authorization: `Bearer ${accessToken}` },
    body: {},
  });
  return asObject(data(res.json), "claim reward");
}

async function staffValidateRedemption(authToken, claimQr) {
  const res = await callApi("POST", "/v1/staff/redemptions/validate", {
    headers: { authorization: `Bearer ${authToken}` },
    body: { claim_qr: claimQr },
  });
  return asObject(data(res.json), "validate redemption");
}

async function seedOrgLoyaltyDemo(org, tenantId, merchantEmail, merchantPassword, orgStores, agentToken) {
  const hq = hqStore(orgStores);
  if (!hq?.id) {
    throw new Error(`No HQ store for org ${org.slug}`);
  }
  const hqSession = await loginScopedWithStore(merchantEmail, merchantPassword, org.slug, hq.id);
  const merchantToken = hqSession.accessToken;
  const rng = mulberry32(`${config.seedRandomSeed}:${org.slug}`);

  await tenantPatchSettings(config.apiBase, merchantToken, tenantId, {
    allow_staff_self_enrollment: true,
  });
  log(`[${org.slug}] Seed org-wide rules + rewards (HQ ${hq.slug})`);
  const ruleCount = await ensureTenantRules(merchantToken, tenantId, hq.slug ?? "main");
  const rewards = await ensureTenantRewardsCatalog(merchantToken, tenantId, hq.slug ?? "main");
  if (org.richDemo) {
    await ensurePilotCampaign(merchantToken, tenantId);
  }

  const hqQr = await tenantGetQrToken(config.apiBase, merchantToken, tenantId);

  log(`[${org.slug}] Enroll main customer ${config.customerPhone} (pooled loyalty)`);
  const enrolled = await ensurePwaEnrollment(merchantToken, tenantId, hqQr, {
    name: config.customerName,
    phone: config.customerPhone,
    email: config.customerEmail,
    phoneVerifyToken: config.customerPhoneVerifyToken || undefined,
  });

  /** @type {Array<{ name: string; phone: string; customer_qr?: string }>} */
  const activityCustomers = [
    {
      name: config.customerName,
      phone: config.customerPhone,
      customer_qr: typeof enrolled.customer_qr === "string" ? enrolled.customer_qr : "",
    },
  ];

  const walkIns = org.richDemo ? SEED_WALK_IN_CUSTOMERS : extraStaffCustomers;
  for (const walkIn of walkIns) {
    log(`[${org.slug}] Enroll walk-in ${walkIn.name} (${walkIn.phone})`);
    const row = await staffCreateCustomer(merchantToken, merchantToken, tenantId, walkIn);
    activityCustomers.push({
      name: walkIn.name,
      phone: walkIn.phone,
      customer_qr: typeof row.customer_qr === "string" ? row.customer_qr : "",
    });
  }

  const activityDays = buildSeedActivityDays(config.seedActivityDays);
  const purchasePlan = buildSeedPurchasePlan(org, orgStores, activityCustomers, activityDays, rng);
  log(
    `[${org.slug}] Seed ${purchasePlan.length} purchases across ${activityDays.length} days (${activityCustomers.length} customers, ${orgStores.length} boutiques)`,
  );

  /** @type {Map<string, string>} */
  const purchaseAuthCache = new Map();
  /** @type {Map<string, number>} */
  const boutiqueCounts = new Map();

  for (const tx of purchasePlan) {
    const storeId = requireString(tx.boutique.id, `store id for ${tx.boutique.slug ?? "main"}`);
    const storeSlug = tx.boutique.slug ?? "main";
    const authKey = `${storeId}:${tx.useAgent ? "agent" : "merchant"}`;
    if (!purchaseAuthCache.has(authKey)) {
      if (tx.useAgent && agentToken) {
        purchaseAuthCache.set(
          authKey,
          (
            await loginScopedWithStore(config.agentEmail, config.agentPassword, org.slug, storeId)
          ).accessToken,
        );
      } else {
        purchaseAuthCache.set(
          authKey,
          storeId === hq.id
            ? hqSession.accessToken
            : (
                await loginScopedWithStore(merchantEmail, merchantPassword, org.slug, storeId)
              ).accessToken,
        );
      }
    }
    const purchaseAuth = purchaseAuthCache.get(authKey);
    log(
      `[${org.slug}/${storeSlug}] Purchase ${tx.amount} FCFA for ${tx.customer.name} (${formatDayLabel(tx.occurredAt)}${tx.useAgent ? ", agent" : ""})`,
    );
    await recordPurchase(purchaseAuth, {
      phone: tx.customer.phone,
      ...(tx.customer.customer_qr ? { customerQr: tx.customer.customer_qr } : {}),
      amountFcfa: tx.amount,
      occurredAt: tx.occurredAt,
    });
    boutiqueCounts.set(storeSlug, (boutiqueCounts.get(storeSlug) ?? 0) + 1);
  }

  const boutiqueActivity = [...boutiqueCounts.entries()].map(([slug, purchaseCount]) => ({
    slug,
    purchaseCount,
  }));

  const metrics = await tenantGetMetrics(config.apiBase, merchantToken, tenantId, { period: "30d" });
  const mainCustomerTx = purchasePlan.filter((tx) => tx.customer.phone === config.customerPhone);
  const totalMainPoints = mainCustomerTx.reduce((sum, tx) => sum + pointsForAmount(tx.amount), 0);
  return {
    hqQr,
    enrolled,
    rewards,
    ruleCount,
    metrics,
    boutiqueActivity,
    purchaseCount: purchasePlan.length,
    totalMainPoints,
  };
}

async function seedClaimAndValidateFlow(org, merchantToken, enrollmentId, rewards) {
  const affordable = rewards
    .map((r) => asObject(r, "reward"))
    .filter((r) => typeof r.point_cost === "number" && r.point_cost <= 200)
    .sort((a, b) => (a.point_cost ?? 0) - (b.point_cost ?? 0));
  const pick =
    affordable[0] ??
    rewards.map((r) => asObject(r, "reward")).sort((a, b) => (a.point_cost ?? 0) - (b.point_cost ?? 0))[0];
  if (!pick?.id) {
    console.warn(`  Skip claim demo for ${org.slug}: no rewards`);
    return null;
  }

  log(`[${org.slug}] Customer OTP login + claim reward "${pick.name}"`);
  const proof = await resolvePhoneVerifyToken(config.customerPhone, config.customerPhoneVerifyToken);
  const loginPayload = await customerLogin(proof);
  const access0 = requireString(loginPayload.access_token, "customer access");
  const sessionPayload = await customerSelectSession(access0, enrollmentId);
  const customerToken = requireString(sessionPayload.access_token, "customer scoped access");

  const catalog = await customerListRewards(customerToken);
  const rewardRows = asArray(catalog.rewards);
  const match =
    rewardRows.find((r) => typeof r === "object" && r && "id" in r && r.id === pick.id) ??
    rewardRows.find((r) => typeof r === "object" && r && r.affordable === true) ??
    rewardRows[0];
  const rewardId = requireString(
    typeof match === "object" && match && "id" in match ? String(match.id) : pick.id,
    "reward id",
  );

  const claim = await customerClaimReward(customerToken, rewardId);
  const claimQr = requireString(claim.claim_qr, "claim_qr");
  const displayCode = typeof claim.display_code === "string" ? claim.display_code : "";

  log(`[${org.slug}] Staff validate claim ${displayCode || claimQr.slice(0, 24)}`);
  const burned = await staffValidateRedemption(merchantToken, claimQr);
  return { claim, burned, rewardId };
}

async function main() {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE} - copy backend/.env.example to backend/.env`);
    process.exit(1);
  }
  if (!config.bootstrapSecret) {
    console.error(`BOOTSTRAP_SECRET not set in ${ENV_FILE}`);
    process.exit(1);
  }

  console.log(`Using API base: ${config.apiBase} (set API_BASE to override)`);
  console.log(
    `Activity window: ${config.seedActivityDays} days (SEED_ACTIVITY_DAYS, seed=${config.seedRandomSeed})`,
  );
  if (!config.publicEnrollRequirePhoneVerify) {
    console.log("Tip: PUBLIC_OTP_DEV_CODE in backend/.env enables automated customer claim seed.");
  }
  await waitForApiReady();

  log(`Bootstrap superadmin (${config.superEmail})`);
  await callApi("POST", "/v1/bootstrap/superadmin", {
    allowError: true,
    headers: { "X-Bootstrap-Secret": config.bootstrapSecret },
    body: { email: config.superEmail, password: config.superPassword },
  });

  log("Login superadmin");
  const superLogin = await loginScoped(config.apiBase, config.superEmail, config.superPassword);
  const superToken = superLogin.accessToken;

  const seededOrgs = [];
  for (const org of organizations) {
    log(`Create organization ${org.name} (${org.slug})`);
    const tenantId = await ensureTenant(superToken, org);

    log(`Invite merchant admin for ${org.slug}`);
    await ensureWorkspaceAccess(
      superToken,
      org.merchantEmail,
      "merchant_admin",
      org.merchantPassword,
      `/v1/superadmin/tenants/${tenantId}/invitations`,
      org.slug,
    );

    log(`Login merchant ${org.merchantEmail}`);
    let merchantSession = await loginScoped(
      config.apiBase,
      org.merchantEmail,
      org.merchantPassword,
      org.slug,
    );

    if (org.activateBilling) {
      await activateOrgSubscription(merchantSession.accessToken);
      merchantSession = await loginScoped(
        config.apiBase,
        org.merchantEmail,
        org.merchantPassword,
        org.slug,
      );
    }

    let orgStores = await listOrgStores(merchantSession.accessToken);
    if (org.boutiques?.length) {
      orgStores = await ensureOrgBoutiques(merchantSession.accessToken, org.boutiques);
    }

    if (org.includeSharedAgent) {
      log(`Invite shared staff into ${org.slug}`);
      await ensureWorkspaceAccess(
        merchantSession.accessToken,
        config.agentEmail,
        "staff",
        config.agentPassword,
        `/v1/tenants/${tenantId}/invitations`,
        org.slug,
      );
    }

    seededOrgs.push({
      ...org,
      tenantId,
      merchantToken: merchantSession.accessToken,
      orgStores,
    });
  }

  log(`Login shared staff (${config.agentEmail})`);
  const sharedAgentSession = await loginScoped(
    config.apiBase,
    config.agentEmail,
    config.agentPassword,
  );
  const sharedAgentWorkspaces = /** @type {WorkspaceRow[]} */ (sharedAgentSession.workspaces);

  /** @type {Array<{ orgSlug: string; enrollmentId: string; points: number; boutiques: string[]; metrics?: Record<string, unknown> }>} */
  const mainCustomerPrograms = [];
  /** @type {Record<string, unknown> | null} */
  let claimDemo = null;

  for (const org of seededOrgs) {
    let agentToken = "";
    if (org.includeSharedAgent) {
      const agentForOrg = await loginScoped(
        config.apiBase,
        config.agentEmail,
        config.agentPassword,
        org.slug,
      );
      agentToken = agentForOrg.accessToken;
    }

    const seeded = await seedOrgLoyaltyDemo(
      org,
      org.tenantId,
      org.merchantEmail,
      org.merchantPassword,
      org.orgStores,
      agentToken || undefined,
    );

    try {
      const smoke = await tenantAdminSmoke(
        config.apiBase,
        org.merchantToken,
        org.tenantId,
        org.slug,
      );
      log(smoke.logLine);
    } catch (err) {
      console.warn(
        `  Tenant admin smoke skipped for ${org.slug}: ${err instanceof Error ? err.message : err}`,
      );
    }

    mainCustomerPrograms.push({
      orgSlug: org.slug,
      enrollmentId: requireString(seeded.enrolled.enrollment_id, `enrollment id for ${org.slug}`),
      points: seeded.totalMainPoints,
      boutiques: seeded.boutiqueActivity.map((row) => row.slug),
      metrics: seeded.metrics,
    });

    if (org.richDemo && seeded.rewards.length > 0) {
      try {
        claimDemo = await seedClaimAndValidateFlow(
          org,
          org.merchantToken,
          requireString(seeded.enrolled.enrollment_id, "enrollment for claim"),
          seeded.rewards,
        );
      } catch (err) {
        console.warn(`  Claim/validate demo skipped: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const crossTenantOrg = seededOrgs[seededOrgs.length - 1];
  log(`Create worker-as-customer case in ${crossTenantOrg.slug}`);
  const crossHq = hqStore(crossTenantOrg.orgStores);
  const crossSession = await loginScopedWithStore(
    crossTenantOrg.merchantEmail,
    crossTenantOrg.merchantPassword,
    crossTenantOrg.slug,
    requireString(crossHq?.id, "cross-tenant HQ id"),
  );
  const crossTenantStoreQr = await tenantGetQrToken(
    config.apiBase,
    crossSession.accessToken,
    crossTenantOrg.tenantId,
  );
  const workerActivityDays = buildSeedActivityDays(config.seedActivityDays);
  const workerRng = mulberry32(`${config.seedRandomSeed}:worker-customer`);
  const workerDay = workerActivityDays[Math.floor(workerRng() * workerActivityDays.length)];
  await ensurePwaEnrollment(
    crossSession.accessToken,
    crossTenantOrg.tenantId,
    crossTenantStoreQr,
    {
    name: config.workerCustomerName,
    phone: config.workerCustomerPhone,
    email: config.agentEmail,
    phoneVerifyToken: config.workerCustomerPhoneVerifyToken || undefined,
    },
  );
  const workerOccurredAt = randomOccurredAt(workerDay, workerRng);
  log(
    `[${crossTenantOrg.slug}] Purchase 3900 FCFA for worker-customer (${formatDayLabel(workerOccurredAt)})`,
  );
  await recordPurchase(crossSession.accessToken, {
    phone: config.workerCustomerPhone,
    amountFcfa: 3900,
    occurredAt: workerOccurredAt,
  });

  const primary = mainCustomerPrograms.find((p) => p.orgSlug === config.tenantSlug);
  const primaryOrg = seededOrgs.find((o) => o.slug === config.tenantSlug);

  console.log("");
  console.log(`Done. Web app (${config.webOrigin}):`);
  console.log(`  Login:       ${config.webOrigin}/login`);
  console.log(
    `  Superadmin:  email=${config.superEmail}  password=${config.superPassword}  -> /root`,
  );
  console.log("");
  console.log("  Merchant admins (organization workspace):");
  for (const org of seededOrgs) {
    const boutiqueSlugs = org.orgStores.map((s) => s.slug).filter(Boolean).join(", ");
    console.log(
      `    ${org.slug}: email=${org.merchantEmail}  password=${org.merchantPassword}  -> /store`,
    );
    console.log(`      Boutiques (${org.orgStores.length}): ${boutiqueSlugs}`);
    console.log(
      `      UI: /store  /store/customers  /store/transactions  /store/analytics  /store/campaigns  /store/enrollment-qr`,
    );
  }
  console.log("");
  console.log(
    `  Shared staff: email=${config.agentEmail}  password=${config.agentPassword}  -> /agent`,
  );
  console.log(
    `    Workspaces: ${sharedAgentWorkspaces.map((row) => row.tenant_slug).filter(Boolean).join(", ")}`,
  );
  console.log(`    UI: /agent  /agent/scanner  /agent/customers  /agent/purchase`);
  console.log("");
  console.log(
    `  Customer: ${config.customerName}  phone=${config.customerPhone}  email=${config.customerEmail}`,
  );
  console.log(
    `    Programs (pooled per org): ${mainCustomerPrograms.map((r) => `${r.orgSlug} (~${r.points} pts, ${r.boutiques.join("+")})`).join("; ")}`,
  );
  console.log(`    UI: /customer/wallet  /customer/rewards  /customer/qr`);
  if (primary?.metrics) {
    const m = primary.metrics;
    console.log(
      `    Primary store metrics (7d): points_distributed=${metricsKpiValue(m, "points_distributed") ?? "?"} active_customers=${metricsKpiValue(m, "active_customers") ?? "?"} rewards_validated=${metricsKpiValue(m, "rewards_validated") ?? "?"}`,
    );
  }
  if (claimDemo) {
    console.log(
      `    Claim demo (${config.tenantSlug}): code=${claimDemo.claim.display_code} reward validated for ${claimDemo.burned.customer_name}`,
    );
  }
  console.log("");
  console.log(
    `  Worker-as-customer: ${config.workerCustomerName}  phone=${config.workerCustomerPhone}  org=${crossTenantOrg.slug}`,
  );
  console.log("");
  console.log("  Join pages (org slug → HQ enrollment QR):");
  for (const org of seededOrgs) {
    console.log(`    ${org.slug}: ${config.webOrigin}/join/${org.slug}`);
  }
  if (primaryOrg) {
    console.log("");
    console.log(`  ${config.tenantName} boutiques (switch in /store after login):`);
    for (const st of primaryOrg.orgStores) {
      console.log(`    - ${st.slug}${st.is_hq ? " (HQ)" : ""}: ${st.name}`);
    }
  }
  console.log("");
  console.log("API seed summary:");
  console.log(`  Base URL:      ${config.apiBase}`);
  console.log(`  Organizations: ${seededOrgs.length}`);
  const boutiqueTotal = seededOrgs.reduce((n, o) => n + o.orgStores.length, 0);
  console.log(`  Boutiques:     ${boutiqueTotal} (HQ main + extras on ${config.tenantSlug} when billing activated)`);
  console.log(
    `  Ledger:        ${config.seedActivityDays} days of earn events; pooled balance; redeem on ${config.tenantSlug} when OTP works`,
  );
  console.log("");
  console.log("Tips:");
  console.log("  - COOKIE_SECURE=false in apps/web/.env.local for http cookies.");
  console.log("  - PUBLIC_OTP_DEV_CODE=000000 in backend/.env for dev-seed customer login.");
  console.log("  - Re-run on fresh DB if duplicate tenant/email errors occur.");
  console.log("");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
