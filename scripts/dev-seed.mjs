#!/usr/bin/env node
/**
 * Local dev seed for dashboards, store admin, agent, and customer portals.
 *
 * Seeds:
 * - superadmin + 5 stores + merchant admins
 * - shared staff (multi-workspace)
 * - points rules + rewards catalog per store
 * - enrolled customers, extra staff-created clients, purchases (ledger / metrics)
 * - primary store: OTP customer session, reward claim + staff validation
 *
 * Requires API running; backend/.env needs BOOTSTRAP_SECRET.
 * For automated customer login: PUBLIC_OTP_DEV_CODE=000000 (see backend/.env.example).
 *
 * Optional env: API_BASE, DEV_OTP_CODE, CUSTOMER_PHONE_VERIFY_TOKEN, etc.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = process.env.ENV_FILE ?? join(ROOT, "backend", ".env");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function env(key, fallback) {
  if (process.env[key] !== undefined && process.env[key] !== "") {
    return process.env[key];
  }
  const file = parseEnvFile(ENV_FILE);
  if (file[key] !== undefined && file[key] !== "") {
    return file[key];
  }
  return fallback;
}

function stripTrailingSlash(url) {
  return url.replace(/\/$/, "");
}

function parseDockerBackendHostPort() {
  const composePath = join(ROOT, "docker-compose.yml");
  if (!existsSync(composePath)) return null;
  const lines = readFileSync(composePath, "utf8").split("\n");
  let inBackend = false;
  for (const line of lines) {
    if (/^\s{2}backend:\s*$/.test(line)) {
      inBackend = true;
      continue;
    }
    if (inBackend && /^\s{2}[a-zA-Z0-9_-]+:\s*$/.test(line) && !/^\s{2}backend:\s*$/.test(line)) {
      inBackend = false;
    }
    if (!inBackend) continue;
    const m = line.match(/-\s*["']?(\d+):8080["']?/);
    if (m) return m[1];
  }
  return null;
}

function portFromPublicFileBaseUrl(fileUrl) {
  if (!fileUrl) return null;
  const m = fileUrl.match(/^https?:\/\/[^/:]+:(\d+)/);
  return m?.[1] ?? null;
}

function resolveApiBase() {
  if (process.env.API_BASE) {
    return stripTrailingSlash(process.env.API_BASE);
  }
  const explicit = env("API_PUBLIC_BASE", "");
  if (explicit) {
    return stripTrailingSlash(explicit);
  }
  const fromFiles = portFromPublicFileBaseUrl(env("PUBLIC_FILE_BASE_URL", ""));
  if (fromFiles) {
    return `http://localhost:${fromFiles}`;
  }
  const fromCompose = parseDockerBackendHostPort();
  if (fromCompose) {
    return `http://localhost:${fromCompose}`;
  }
  const httpPort = env("HTTP_PORT", "8082");
  if (httpPort === "8080") {
    return "http://localhost:8082";
  }
  return `http://localhost:${httpPort}`;
}

const config = {
  apiBase: resolveApiBase(),
  webOrigin: env("WEB_ORIGIN", "http://localhost:3000"),
  bootstrapSecret: env("BOOTSTRAP_SECRET", ""),
  publicEnrollRequirePhoneVerify: env("PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY", "") === "true",
  devOtpCode: env("DEV_OTP_CODE", env("PUBLIC_OTP_DEV_CODE", "000000")),
  superEmail: env("SUPER_EMAIL", "super@jubely.local"),
  superPassword: env("SUPER_PASSWORD", "SuperAdmin123!"),
  tenantName: env("TENANT_NAME", "Chez Mama"),
  tenantSlug: env("TENANT_SLUG", "chez-mama"),
  merchantEmail: env("MERCHANT_EMAIL", "merchant@chezmama.local"),
  merchantPassword: env("MERCHANT_PASSWORD", "MerchantAdmin123!"),
  agentEmail: env("AGENT_EMAIL", "agent.multi@jubely.local"),
  agentPassword: env("AGENT_PASSWORD", "AgentStaff123!"),
  customerName: env("CUSTOMER_NAME", "Awa Diop"),
  customerPhone: env("CUSTOMER_PHONE", "+237611111111"),
  customerEmail: env("CUSTOMER_EMAIL", "awa@example.com"),
  customerPhoneVerifyToken: env("CUSTOMER_PHONE_VERIFY_TOKEN", ""),
  workerCustomerPhone: env("WORKER_CUSTOMER_PHONE", "+237622222222"),
  workerCustomerName: env("WORKER_CUSTOMER_NAME", "Mireille Workspace"),
  workerCustomerPhoneVerifyToken: env("WORKER_CUSTOMER_PHONE_VERIFY_TOKEN", ""),
  purchaseAmountFcfa: Number(env("PURCHASE_AMOUNT_FCFA", "4500")),
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

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
      on: storeSlug === config.tenantSlug,
      trigger: "transaction",
      cond: { days: [0, 1, 2, 3, 4], hours: [17, 19], tier: "all", minAmount: 0 },
      action: { type: "mult", factor: 2 },
    },
    {
      id: `${storeSlug}-first`,
      name: "Première visite",
      tag: "Bonus",
      on: storeSlug === config.tenantSlug,
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
  if (storeSlug === config.tenantSlug) {
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

const stores = [
  {
    name: config.tenantName,
    slug: config.tenantSlug,
    merchantEmail: config.merchantEmail,
    merchantPassword: config.merchantPassword,
    purchaseAmountFcfa: config.purchaseAmountFcfa,
    extraPurchases: [2200, 3100],
    includeSharedAgent: true,
    richDemo: true,
  },
  {
    name: "Maison Naka",
    slug: "maison-naka",
    merchantEmail: "merchant.maison-naka@jubely.local",
    merchantPassword: "MerchantMaison123!",
    purchaseAmountFcfa: 6200,
    extraPurchases: [1500],
    includeSharedAgent: true,
    richDemo: false,
  },
  {
    name: "Bantu Coffee",
    slug: "bantu-coffee",
    merchantEmail: "merchant.bantu-coffee@jubely.local",
    merchantPassword: "MerchantBantu123!",
    purchaseAmountFcfa: 7800,
    extraPurchases: [],
    includeSharedAgent: true,
    richDemo: false,
  },
  {
    name: "Le Marche",
    slug: "le-marche",
    merchantEmail: "merchant.le-marche@jubely.local",
    merchantPassword: "MerchantMarche123!",
    purchaseAmountFcfa: 9100,
    extraPurchases: [4000],
    includeSharedAgent: true,
    richDemo: false,
  },
  {
    name: "Atelier Sawa",
    slug: "atelier-sawa",
    merchantEmail: "merchant.atelier-sawa@jubely.local",
    merchantPassword: "MerchantSawa123!",
    purchaseAmountFcfa: 5400,
    extraPurchases: [],
    includeSharedAgent: false,
    richDemo: false,
  },
];

const extraStaffCustomers = [
  { name: "Jean Kouam", phone: "+237633333331", amountFcfa: 12500 },
  { name: "Fatou Njoya", phone: "+237644444442", amountFcfa: 2800 },
];

function log(step) {
  console.log(`-> ${step}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @typedef {{ data?: unknown; error?: { code?: string; message?: string } }} ApiEnvelope
 * @typedef {{ tenant_id?: string; name?: string; slug?: string }} TenantRow
 * @typedef {{ membership_id?: string; tenant_slug?: string; tenant_name?: string; role?: string }} WorkspaceRow
 * @typedef {{ enrollment_id?: string; phone?: string; name?: string; points_balance?: number; customer_qr?: string }} StoreCustomerRow
 */

/**
 * @param {string} method
 * @param {string} path
 * @param {{ headers?: Record<string, string>; body?: unknown; allowError?: boolean }} [opts]
 */
async function api(method, path, opts = {}) {
  const url = `${config.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = { accept: "application/json", ...opts.headers };
  let body;
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  /** @type {ApiEnvelope | null} */
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`${method} ${path}: invalid JSON (${res.status}): ${text.slice(0, 200)}`);
    }
  }
  if (!res.ok && !opts.allowError) {
    const msg = json?.error?.message ?? text.slice(0, 200) ?? res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${msg}`);
  }
  return { res, json, text };
}

function data(json) {
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  return undefined;
}

function asObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected object`);
  }
  return /** @type {Record<string, unknown>} */ (value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}: missing string value`);
  }
  return value.trim();
}

/** Default earn rule: 1 pt / 100 FCFA (matches rule engine). */
function pointsForAmount(amountFcfa) {
  return Math.floor(amountFcfa / 100);
}

async function waitForApi() {
  log(`Health check ${config.apiBase}/health`);
  for (let i = 0; i < 30; i++) {
    try {
      const { json } = await api("GET", "/health", { allowError: true });
      if (json?.data && typeof json.data === "object" && json.data.status === "ok") {
        return;
      }
    } catch {
      // retry
    }
    if (i > 0) await sleep(1000);
  }
  let last = "";
  try {
    const r = await fetch(`${config.apiBase}/health`);
    last = await r.text();
  } catch (error) {
    last = String(error);
  }
  console.error(`API not ready at ${config.apiBase}/health`);
  console.error("Last response:", last.slice(0, 500));
  console.error("Tip: cd backend && go run ./cmd/api  (check HTTP_PORT in backend/.env)");
  process.exit(1);
}

async function inviteAndAccept(auth, email, role, password, invPath) {
  const inv = await api("POST", invPath, {
    headers: { authorization: `Bearer ${auth}` },
    body: { email, role },
  });
  const token = requireString(asObject(data(inv.json), `invite ${email}`).token, `invite token for ${email}`);
  await api("POST", `/v1/invitations/${encodeURIComponent(token)}/accept`, {
    body: { password },
  });
}

async function listTenants(superToken) {
  const list = await api("GET", "/v1/superadmin/tenants?limit=200", {
    headers: { authorization: `Bearer ${superToken}` },
  });
  return /** @type {TenantRow[]} */ (asArray(data(list.json)));
}

async function ensureTenant(superToken, store) {
  const created = await api("POST", "/v1/superadmin/tenants", {
    allowError: true,
    headers: { authorization: `Bearer ${superToken}` },
    body: { name: store.name, slug: store.slug, plan: "starter" },
  });
  const payload = data(created.json);
  if (payload && typeof payload === "object") {
    const obj = /** @type {Record<string, unknown>} */ (payload);
    const tenantId = typeof obj.tenant_id === "string" ? obj.tenant_id : typeof obj.id === "string" ? obj.id : "";
    if (tenantId) return tenantId;
  }
  const tenants = await listTenants(superToken);
  const found = tenants.find((row) => row.slug === store.slug);
  if (!found?.tenant_id) {
    throw new Error(`Could not resolve tenant id for ${store.slug}`);
  }
  return found.tenant_id;
}

async function login(email, password, preferredTenantSlug = "") {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await api("POST", "/v1/auth/login", {
      allowError: true,
      body: {
        email,
        password,
        ...(preferredTenantSlug ? { tenant_slug: preferredTenantSlug } : {}),
      },
    });
    if (res.res.ok) {
      return asObject(data(res.json), `login ${email}`);
    }
    if (res.res.status === 429 && attempt < 5) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const message =
      res.json?.error?.message ??
      res.text.slice(0, 200) ??
      `login failed for ${email}`;
    throw new Error(`POST /v1/auth/login failed (${res.res.status}): ${String(message)}`);
  }
  throw new Error(`login retries exhausted for ${email}`);
}

async function maybeLogin(email, password) {
  try {
    return await login(email, password);
  } catch {
    return null;
  }
}

async function selectWorkspace(accessToken, membershipId) {
  const res = await api("POST", "/v1/auth/workspace", {
    headers: { authorization: `Bearer ${accessToken}` },
    body: { membership_id: membershipId },
  });
  return asObject(data(res.json), `select workspace ${membershipId}`);
}

function hasWorkspace(payload, desiredTenantSlug) {
  if (!desiredTenantSlug) return true;
  const workspaces = /** @type {WorkspaceRow[]} */ (asArray(payload.workspaces));
  return workspaces.some((row) => row.tenant_slug === desiredTenantSlug);
}

async function loginScoped(email, password, desiredTenantSlug = "") {
  const payload = await login(email, password);
  const step = typeof payload.step === "string" ? payload.step : "ok";
  if (step === "mfa_required") {
    throw new Error(`Seed users should not require MFA (${email})`);
  }
  const initialAccessToken = requireString(payload.access_token, `initial access token for ${email}`);
  const workspaces = /** @type {WorkspaceRow[]} */ (asArray(payload.workspaces));

  if (step === "workspace_selection_required") {
    if (!desiredTenantSlug) {
      return {
        accessToken: initialAccessToken,
        initialAccessToken,
        initialPayload: payload,
        payload,
        workspaces,
        membershipId: "",
      };
    }
    const workspace =
      workspaces.find((row) => row.tenant_slug === desiredTenantSlug) ??
      (workspaces.length === 1 ? workspaces[0] : null);
    if (!workspace?.membership_id) {
      throw new Error(`No workspace found for ${email} in ${desiredTenantSlug || "requested scope"}`);
    }
    const scoped = await selectWorkspace(initialAccessToken, workspace.membership_id);
    return {
      accessToken: requireString(scoped.access_token, `scoped access token for ${email}`),
      initialAccessToken,
      initialPayload: payload,
      payload: scoped,
      workspaces,
      membershipId: workspace.membership_id,
    };
  }

  return {
    accessToken: initialAccessToken,
    initialAccessToken,
    initialPayload: payload,
    payload,
    workspaces,
    membershipId: typeof payload.membership_id === "string" ? payload.membership_id : "",
  };
}

async function ensureWorkspaceAccess(inviterAuthToken, email, role, password, invPath, desiredTenantSlug = "") {
  const existing = await maybeLogin(email, password);
  if (existing && hasWorkspace(existing, desiredTenantSlug)) {
    return;
  }
  await inviteAndAccept(inviterAuthToken, email, role, password, invPath);
}

async function listStoreCustomers(authToken) {
  const res = await api("GET", "/v1/store/customers?limit=200", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  return /** @type {StoreCustomerRow[]} */ (asArray(data(res.json)));
}

async function getStoreQr(authToken) {
  const res = await api("GET", "/v1/store/qr", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const payload = asObject(data(res.json), "store qr");
  return requireString(payload.store_qr, "store qr");
}

async function getStoreMetrics(authToken) {
  const res = await api("GET", "/v1/store/metrics", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  return asObject(data(res.json), "store metrics");
}

/** Staff/merchant POST /staff/customers requires this when the actor has a store membership. */
async function ensureStaffCanEnrollCustomers(authToken) {
  await api("PATCH", "/v1/store/tenant", {
    headers: { authorization: `Bearer ${authToken}` },
    body: { allow_staff_self_enrollment: true },
  });
}

async function listStoreRules(authToken) {
  const res = await api("GET", "/v1/store/rules", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const payload = asObject(data(res.json), "store rules");
  return asArray(payload.rules);
}

async function createStoreRule(authToken, rule, priority = 0) {
  await api("POST", "/v1/store/rules", {
    headers: { authorization: `Bearer ${authToken}` },
    body: { rule, priority, active: true },
  });
}

async function ensureStoreRules(authToken, storeSlug) {
  const existing = await listStoreRules(authToken);
  if (existing.length > 0) {
    return existing.length;
  }
  let n = 0;
  for (const [i, rule] of pilotRulesForStore(storeSlug).entries()) {
    await createStoreRule(authToken, rule, i);
    n++;
  }
  return n;
}

async function listStoreRewards(authToken) {
  const res = await api("GET", "/v1/store/rewards?active=false", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const payload = asObject(data(res.json), "store rewards");
  return asArray(payload.rewards);
}

async function createStoreReward(authToken, reward) {
  const res = await api("POST", "/v1/store/rewards", {
    headers: { authorization: `Bearer ${authToken}` },
    body: { ...reward, active: true },
  });
  return asObject(data(res.json), "create reward");
}

async function ensureStoreRewards(authToken, storeSlug) {
  const existing = await listStoreRewards(authToken);
  if (existing.length > 0) {
    return existing;
  }
  const created = [];
  for (const row of pilotRewardsForStore(storeSlug)) {
    created.push(await createStoreReward(authToken, row));
  }
  return created;
}

async function ensurePwaEnrollment(merchantAuthToken, storeQr, customer) {
  if (config.publicEnrollRequirePhoneVerify && !customer.phoneVerifyToken) {
    throw new Error(
      `PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY=true requires a phone proof token for ${customer.phone}. Set CUSTOMER_PHONE_VERIFY_TOKEN or use PUBLIC_OTP_DEV_CODE.`,
    );
  }
  const res = await api("POST", "/v1/public/enrollments", {
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
  const existingRows = await listStoreCustomers(merchantAuthToken);
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

async function staffCreateCustomer(authToken, merchantAuthToken, customer) {
  const res = await api("POST", "/v1/staff/customers", {
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
  const existingRows = await listStoreCustomers(merchantAuthToken);
  const existing = existingRows.find((row) => row.phone === customer.phone);
  if (existing?.enrollment_id) {
    return { enrollment_id: existing.enrollment_id, customer_qr: "" };
  }
  const message = res.json?.error?.message ?? res.text.slice(0, 200);
  throw new Error(`POST /v1/staff/customers failed (${res.res.status}): ${message}`);
}

async function recordPurchase(authToken, { phone, customerQr, amountFcfa }) {
  const res = await api("POST", "/v1/staff/purchases", {
    headers: { authorization: `Bearer ${authToken}` },
    body: {
      ...(phone ? { phone_e164: phone } : {}),
      ...(customerQr ? { customer_qr: customerQr } : {}),
      amount_fcfa: amountFcfa,
    },
  });
  return asObject(data(res.json), `purchase ${phone ?? customerQr ?? amountFcfa}`);
}

async function otpSend(phone) {
  await api("POST", "/v1/public/otp/send", { body: { phone_e164: phone } });
}

async function otpVerify(phone, code) {
  const res = await api("POST", "/v1/public/otp/verify", {
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
  const res = await api("POST", "/v1/auth/customer/login", {
    body: { phone_verify_token: phoneVerifyToken },
  });
  return asObject(data(res.json), "customer login");
}

async function customerSelectSession(accessToken, enrollmentId) {
  const res = await api("POST", "/v1/auth/customer/session", {
    headers: { authorization: `Bearer ${accessToken}` },
    body: { enrollment_id: enrollmentId },
  });
  return asObject(data(res.json), "customer session");
}

async function customerListRewards(accessToken) {
  const res = await api("GET", "/v1/customers/me/rewards", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return asObject(data(res.json), "customer rewards");
}

async function customerClaimReward(accessToken, rewardId) {
  const res = await api("POST", `/v1/customers/me/rewards/${encodeURIComponent(rewardId)}/claims`, {
    headers: { authorization: `Bearer ${accessToken}` },
    body: {},
  });
  return asObject(data(res.json), "claim reward");
}

async function staffValidateRedemption(authToken, claimQr) {
  const res = await api("POST", "/v1/staff/redemptions/validate", {
    headers: { authorization: `Bearer ${authToken}` },
    body: { claim_qr: claimQr },
  });
  return asObject(data(res.json), "validate redemption");
}

async function seedStoreCatalogAndLedger(store, merchantToken, agentToken) {
  await ensureStaffCanEnrollCustomers(merchantToken);
  log(`[${store.slug}] Seed rules + rewards`);
  const ruleCount = await ensureStoreRules(merchantToken, store.slug);
  const rewards = await ensureStoreRewards(merchantToken, store.slug);

  const storeQr = await getStoreQr(merchantToken);
  const purchaseAuth = agentToken ?? merchantToken;

  log(`[${store.slug}] Enroll main customer ${config.customerPhone}`);
  const enrolled = await ensurePwaEnrollment(merchantToken, storeQr, {
    name: config.customerName,
    phone: config.customerPhone,
    email: config.customerEmail,
    phoneVerifyToken: config.customerPhoneVerifyToken || undefined,
  });

  const amounts = [store.purchaseAmountFcfa, ...store.extraPurchases];
  for (const amount of amounts) {
    log(`[${store.slug}] Purchase ${amount} FCFA for ${config.customerPhone}`);
    await recordPurchase(purchaseAuth, { phone: config.customerPhone, amountFcfa: amount });
  }

  if (store.richDemo) {
    for (const extra of extraStaffCustomers) {
      log(`[${store.slug}] Staff-create ${extra.phone}`);
      const created = await staffCreateCustomer(merchantToken, merchantToken, {
        name: extra.name,
        phone: extra.phone,
      });
      log(`[${store.slug}] Purchase ${extra.amountFcfa} FCFA for ${extra.name}`);
      await recordPurchase(
        purchaseAuth,
        created.customer_qr
          ? { customerQr: String(created.customer_qr), amountFcfa: extra.amountFcfa }
          : { phone: extra.phone, amountFcfa: extra.amountFcfa },
      );
    }
  }

  const metrics = await getStoreMetrics(merchantToken);
  return {
    storeQr,
    enrolled,
    rewards,
    ruleCount,
    metrics,
    totalMainPoints: amounts.reduce((sum, a) => sum + pointsForAmount(a), 0),
  };
}

async function seedClaimAndValidateFlow(store, merchantToken, enrollmentId, rewards) {
  const affordable = rewards
    .map((r) => asObject(r, "reward"))
    .filter((r) => typeof r.point_cost === "number" && r.point_cost <= 200)
    .sort((a, b) => (a.point_cost ?? 0) - (b.point_cost ?? 0));
  const pick =
    affordable[0] ??
    rewards.map((r) => asObject(r, "reward")).sort((a, b) => (a.point_cost ?? 0) - (b.point_cost ?? 0))[0];
  if (!pick?.id) {
    console.warn(`  Skip claim demo for ${store.slug}: no rewards`);
    return null;
  }

  log(`[${store.slug}] Customer OTP login + claim reward "${pick.name}"`);
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

  log(`[${store.slug}] Staff validate claim ${displayCode || claimQr.slice(0, 24)}`);
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
  if (!config.publicEnrollRequirePhoneVerify) {
    console.log("Tip: PUBLIC_OTP_DEV_CODE in backend/.env enables automated customer claim seed.");
  }
  await waitForApi();

  log(`Bootstrap superadmin (${config.superEmail})`);
  await api("POST", "/v1/bootstrap/superadmin", {
    allowError: true,
    headers: { "X-Bootstrap-Secret": config.bootstrapSecret },
    body: { email: config.superEmail, password: config.superPassword },
  });

  log("Login superadmin");
  const superLogin = await loginScoped(config.superEmail, config.superPassword);
  const superToken = superLogin.accessToken;

  const seededStores = [];
  for (const store of stores) {
    log(`Create store ${store.name} (${store.slug})`);
    const tenantId = await ensureTenant(superToken, store);

    log(`Invite merchant admin for ${store.slug}`);
    await ensureWorkspaceAccess(
      superToken,
      store.merchantEmail,
      "merchant_admin",
      store.merchantPassword,
      `/v1/superadmin/tenants/${tenantId}/invitations`,
      store.slug,
    );

    log(`Login merchant ${store.merchantEmail}`);
    const merchantSession = await loginScoped(store.merchantEmail, store.merchantPassword, store.slug);

    if (store.includeSharedAgent) {
      log(`Invite shared staff into ${store.slug}`);
      await ensureWorkspaceAccess(
        merchantSession.accessToken,
        config.agentEmail,
        "staff",
        config.agentPassword,
        "/v1/store/invitations",
        store.slug,
      );
    }

    seededStores.push({
      ...store,
      tenantId,
      merchantToken: merchantSession.accessToken,
    });
  }

  log(`Login shared staff (${config.agentEmail})`);
  const sharedAgentSession = await loginScoped(config.agentEmail, config.agentPassword);
  const sharedAgentWorkspaces = /** @type {WorkspaceRow[]} */ (sharedAgentSession.workspaces);

  /** @type {Array<{ storeSlug: string; enrollmentId: string; points: number; metrics?: Record<string, unknown> }>} */
  const mainCustomerPrograms = [];
  /** @type {Record<string, unknown> | null} */
  let claimDemo = null;

  for (const store of seededStores) {
    let agentToken = "";
    if (store.includeSharedAgent) {
      const agentForStore = await loginScoped(config.agentEmail, config.agentPassword, store.slug);
      agentToken = agentForStore.accessToken;
    }

    const seeded = await seedStoreCatalogAndLedger(store, store.merchantToken, agentToken || undefined);

    mainCustomerPrograms.push({
      storeSlug: store.slug,
      enrollmentId: requireString(seeded.enrolled.enrollment_id, `enrollment id for ${store.slug}`),
      points: seeded.totalMainPoints,
      metrics: seeded.metrics,
    });

    if (store.richDemo && seeded.rewards.length > 0) {
      try {
        claimDemo = await seedClaimAndValidateFlow(
          store,
          store.merchantToken,
          requireString(seeded.enrolled.enrollment_id, "enrollment for claim"),
          seeded.rewards,
        );
      } catch (err) {
        console.warn(`  Claim/validate demo skipped: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const crossTenantStore = seededStores[seededStores.length - 1];
  log(`Create worker-as-customer case in ${crossTenantStore.slug}`);
  const crossTenantStoreQr = await getStoreQr(crossTenantStore.merchantToken);
  const workerCustomerEnrollment = await ensurePwaEnrollment(crossTenantStore.merchantToken, crossTenantStoreQr, {
    name: config.workerCustomerName,
    phone: config.workerCustomerPhone,
    email: config.agentEmail,
    phoneVerifyToken: config.workerCustomerPhoneVerifyToken || undefined,
  });
  await recordPurchase(crossTenantStore.merchantToken, {
    phone: config.workerCustomerPhone,
    amountFcfa: 3900,
  });

  const primary = mainCustomerPrograms.find((p) => p.storeSlug === config.tenantSlug);

  console.log("");
  console.log(`Done. Web app (${config.webOrigin}):`);
  console.log(`  Login:       ${config.webOrigin}/login`);
  console.log(
    `  Superadmin:  email=${config.superEmail}  password=${config.superPassword}  -> /root`,
  );
  console.log("");
  console.log("  Merchant admins (single workspace):");
  for (const store of seededStores) {
    console.log(
      `    ${store.slug}: email=${store.merchantEmail}  password=${store.merchantPassword}  -> /store`,
    );
    console.log(
      `      UI: /store  /store/customers  /store/transactions  /store/rewards  /store/points-rules`,
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
  console.log(`    Programs: ${mainCustomerPrograms.map((r) => `${r.storeSlug} (~${r.points} pts)`).join(", ")}`);
  console.log(`    UI: /customer/wallet  /customer/rewards  /customer/qr`);
  if (primary?.metrics) {
    const m = primary.metrics;
    console.log(
      `    Primary store metrics: distributed=${m.points_distributed} today_clients=${m.clients_served_today} today_pts=${m.points_issued_today} redemptions_today=${m.redemptions_today}`,
    );
  }
  if (claimDemo) {
    console.log(
      `    Claim demo (${config.tenantSlug}): code=${claimDemo.claim.display_code} reward validated for ${claimDemo.burned.customer_name}`,
    );
  }
  console.log("");
  console.log(
    `  Worker-as-customer: ${config.workerCustomerName}  phone=${config.workerCustomerPhone}  store=${crossTenantStore.slug}`,
  );
  console.log("");
  console.log("  Join pages:");
  for (const store of seededStores) {
    console.log(`    ${store.slug}: ${config.webOrigin}/join/${store.slug}`);
  }
  console.log("");
  console.log("API seed summary:");
  console.log(`  Base URL:      ${config.apiBase}`);
  console.log(`  Stores:        ${seededStores.length} (rules + rewards each)`);
  console.log(`  Ledger:        multiple earn events per store; 1 redeem on ${config.tenantSlug} when OTP works`);
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
