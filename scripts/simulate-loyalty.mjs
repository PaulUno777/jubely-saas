#!/usr/bin/env node
/**
 * Simulate normal daily loyalty activity against a running API.
 *
 * Run after `pnpm dev:seed` (or equivalent) so tenants, rules, and rewards exist.
 *
 * Each run typically:
 * - enrolls new walk-in customers (public QR + optional staff enroll)
 * - records purchases (points attribution)
 * - claims an affordable reward and staff-validates when balance allows
 *
 * Requires API running; backend/.env with PUBLIC_OTP_DEV_CODE=000000 for claim flow.
 *
 * Optional env: API_BASE, TENANT_SLUG, MERCHANT_EMAIL, MERCHANT_PASSWORD,
 *   AGENT_EMAIL, AGENT_PASSWORD, SIM_NEW_ENROLLMENTS, SIM_PURCHASES, SIM_CLAIMS, SIM_DRY_RUN
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
  dryRun: env("SIM_DRY_RUN", "") === "true",
  devOtpCode: env("DEV_OTP_CODE", env("PUBLIC_OTP_DEV_CODE", "000000")),
  tenantSlug: env("TENANT_SLUG", "chez-mama"),
  merchantEmail: env("MERCHANT_EMAIL", "merchant@chezmama.local"),
  merchantPassword: env("MERCHANT_PASSWORD", "MerchantAdmin123!"),
  agentEmail: env("AGENT_EMAIL", "agent.multi@jubely.local"),
  agentPassword: env("AGENT_PASSWORD", "AgentStaff123!"),
  newEnrollments: Math.max(0, Number(env("SIM_NEW_ENROLLMENTS", "2"))),
  purchases: Math.max(0, Number(env("SIM_PURCHASES", "5"))),
  claims: Math.max(0, Number(env("SIM_CLAIMS", "1"))),
};

const WALK_IN_NAMES = [
  "Clarisse Mbarga",
  "Ibrahim Nguema",
  "Sandrine Tchoumi",
  "Eric Fouda",
  "Nadine Abena",
  "Patrick Essomba",
  "Grace Nkoulou",
  "David Kamga",
];

const PURCHASE_AMOUNTS_FCFA = [1200, 1800, 2500, 3200, 4500, 5200, 6800, 8500, 11200, 15600];

function log(step) {
  console.log(`-> ${step}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  return pick(PURCHASE_AMOUNTS_FCFA);
}

function uniquePhone() {
  const suffix = String(Date.now() + Math.floor(Math.random() * 10000)).slice(-8);
  return `+2376${suffix}`;
}

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
  /** @type {{ data?: unknown; error?: { message?: string } } | null} */
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

async function waitForApi() {
  log(`Health check ${config.apiBase}/health`);
  for (let i = 0; i < 20; i++) {
    try {
      const { json } = await api("GET", "/health", { allowError: true });
      if (json?.data && typeof json.data === "object" && json.data.status === "ok") {
        return;
      }
    } catch {
      // retry
    }
    if (i > 0) await sleep(800);
  }
  console.error(`API not ready at ${config.apiBase}/health`);
  console.error("Run the API first, then `pnpm dev:seed` if the tenant is missing.");
  process.exit(1);
}

async function login(email, password, preferredTenantSlug = "") {
  const res = await api("POST", "/v1/auth/login", {
    allowError: true,
    body: {
      email,
      password,
      ...(preferredTenantSlug ? { tenant_slug: preferredTenantSlug } : {}),
    },
  });
  if (!res.res.ok) {
    const message = res.json?.error?.message ?? res.text.slice(0, 200);
    throw new Error(`POST /v1/auth/login failed (${res.res.status}): ${message}`);
  }
  return asObject(data(res.json), `login ${email}`);
}

async function selectWorkspace(accessToken, membershipId, activeStoreId = "") {
  const body = { membership_id: membershipId };
  if (activeStoreId) {
    body.active_store_id = activeStoreId;
  }
  const res = await api("POST", "/v1/auth/workspace", {
    headers: { authorization: `Bearer ${accessToken}` },
    body,
  });
  return asObject(data(res.json), "workspace");
}

async function loginScoped(email, password, tenantSlug, activeStoreId = "") {
  const payload = await login(email, password, tenantSlug);
  const step = typeof payload.step === "string" ? payload.step : "ok";
  const initialAccessToken = requireString(payload.access_token, "access token");
  const workspaces = asArray(payload.workspaces);

  if (step === "workspace_selection_required") {
    const workspace =
      workspaces.find(
        (row) => typeof row === "object" && row && row.tenant_slug === tenantSlug,
      ) ?? workspaces[0];
    const membershipId =
      typeof workspace === "object" && workspace && typeof workspace.membership_id === "string"
        ? workspace.membership_id
        : "";
    if (!membershipId) {
      throw new Error(`No workspace for ${email} in ${tenantSlug}`);
    }
    const scoped = await selectWorkspace(initialAccessToken, membershipId, activeStoreId);
    return {
      accessToken: requireString(scoped.access_token, "scoped token"),
      membershipId,
    };
  }

  if (activeStoreId && typeof payload.membership_id === "string") {
    const scoped = await selectWorkspace(initialAccessToken, payload.membership_id, activeStoreId);
    return {
      accessToken: requireString(scoped.access_token, "scoped token"),
      membershipId: payload.membership_id,
    };
  }

  return {
    accessToken: initialAccessToken,
    membershipId: typeof payload.membership_id === "string" ? payload.membership_id : "",
  };
}

async function listOrgStores(token) {
  const res = await api("GET", "/v1/organizations/me/stores", {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(asObject(data(res.json), "stores").stores);
}

async function getStoreQr(token) {
  const res = await api("GET", "/v1/store/qr", {
    headers: { authorization: `Bearer ${token}` },
  });
  return requireString(asObject(data(res.json), "qr").store_qr, "store_qr");
}

async function listCustomers(token) {
  const res = await api("GET", "/v1/store/customers?limit=200", {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(data(res.json));
}

async function listRewards(token) {
  const res = await api("GET", "/v1/store/rewards?active=true", {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(asObject(data(res.json), "rewards").rewards);
}

async function getMetrics(token) {
  const res = await api("GET", "/v1/store/metrics", {
    headers: { authorization: `Bearer ${token}` },
  });
  return asObject(data(res.json), "metrics");
}

async function publicEnroll(storeQr, customer) {
  const res = await api("POST", "/v1/public/enrollments", {
    allowError: true,
    body: {
      store_qr: storeQr,
      name: customer.name,
      phone_e164: customer.phone,
    },
  });
  if (res.res.ok) {
    return asObject(data(res.json), "enrollment");
  }
  return null;
}

async function staffEnroll(token, customer) {
  const res = await api("POST", "/v1/staff/customers", {
    allowError: true,
    headers: { authorization: `Bearer ${token}` },
    body: {
      name: customer.name,
      phone_e164: customer.phone,
    },
  });
  if (res.res.ok) {
    return asObject(data(res.json), "staff customer");
  }
  return null;
}

async function recordPurchase(token, { phone, customerQr, amountFcfa }) {
  const res = await api("POST", "/v1/staff/purchases", {
    headers: { authorization: `Bearer ${token}` },
    body: {
      ...(phone ? { phone_e164: phone } : {}),
      ...(customerQr ? { customer_qr: customerQr } : {}),
      amount_fcfa: amountFcfa,
    },
  });
  return asObject(data(res.json), "purchase");
}

async function otpSend(phone) {
  await api("POST", "/v1/public/otp/send", { body: { phone_e164: phone } });
}

async function otpVerify(phone, code) {
  const res = await api("POST", "/v1/public/otp/verify", {
    body: { phone_e164: phone, code },
  });
  return requireString(asObject(data(res.json), "otp").phone_verify_token, "phone_verify_token");
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
  return asObject(data(res.json), "claim");
}

async function staffValidateRedemption(token, claimQr) {
  const res = await api("POST", "/v1/staff/redemptions/validate", {
    headers: { authorization: `Bearer ${token}` },
    body: { claim_qr: claimQr },
  });
  return asObject(data(res.json), "validate");
}

/** @typedef {{ enrollment_id?: string; phone?: string; name?: string; points_balance?: number; customer_qr?: string }} CustomerRow */

async function simulateEnrollments(merchantToken, storeQr, count) {
  const created = [];
  for (let i = 0; i < count; i++) {
    const customer = {
      name: pick(WALK_IN_NAMES),
      phone: uniquePhone(),
    };
    log(`Enroll walk-in ${customer.name} (${customer.phone})`);
    if (config.dryRun) {
      created.push({ ...customer, enrollment_id: "dry-run" });
      continue;
    }
    const viaPublic = i % 2 === 0 ? await publicEnroll(storeQr, customer) : null;
    const row =
      viaPublic ??
      (await staffEnroll(merchantToken, customer)) ??
      (await publicEnroll(storeQr, customer));
    if (!row?.enrollment_id) {
      console.warn(`  Skip enroll ${customer.phone}: already exists or failed`);
      continue;
    }
    created.push({
      name: customer.name,
      phone: customer.phone,
      enrollment_id: String(row.enrollment_id),
      customer_qr: typeof row.customer_qr === "string" ? row.customer_qr : "",
    });
  }
  return created;
}

async function simulatePurchases(purchaseToken, customers, count) {
  const pool = customers.filter((c) => c.phone || c.customer_qr);
  if (pool.length === 0) {
    console.warn("  No customers for purchases — run dev:seed or increase SIM_NEW_ENROLLMENTS");
    return [];
  }
  const results = [];
  for (let i = 0; i < count; i++) {
    const customer = pick(pool);
    const amount = randomAmount();
    log(
      `Purchase ${amount} FCFA for ${customer.name ?? customer.phone} (${customer.phone ?? "qr"})`,
    );
    if (config.dryRun) {
      results.push({ amount, phone: customer.phone });
      continue;
    }
    const out = await recordPurchase(purchaseToken, {
      phone: customer.phone,
      customerQr: customer.customer_qr || undefined,
      amountFcfa: amount,
    });
    results.push({
      amount,
      phone: customer.phone,
      points_awarded: out.points_awarded,
    });
  }
  return results;
}

async function simulateClaims(merchantToken, customers, rewardCatalog, maxClaims) {
  if (maxClaims <= 0 || !config.devOtpCode) {
    if (maxClaims > 0 && !config.devOtpCode) {
      console.warn("  Skip claims: set PUBLIC_OTP_DEV_CODE in backend/.env");
    }
    return [];
  }

  const storeRewards = rewardCatalog
    .map((r) => asObject(r, "reward"))
    .filter((r) => typeof r.point_cost === "number")
    .sort((a, b) => (a.point_cost ?? 0) - (b.point_cost ?? 0));
  if (storeRewards.length === 0) {
    console.warn("  Skip claims: no active rewards");
    return [];
  }

  const candidates = customers
    .filter((c) => c.enrollment_id && c.phone)
    .sort((a, b) => (b.points_balance ?? 0) - (a.points_balance ?? 0));

  const outcomes = [];
  for (const customer of candidates) {
    if (outcomes.length >= maxClaims) break;

    const affordable = storeRewards.find(
      (r) => (r.point_cost ?? 0) <= (customer.points_balance ?? 0),
    );
    if (!affordable?.id) continue;

    const rewardId = String(affordable.id);
    const rewardName = typeof affordable.name === "string" ? affordable.name : rewardId;
    log(`Claim "${rewardName}" for ${customer.name ?? customer.phone}`);

    if (config.dryRun) {
      outcomes.push({ customer: customer.phone, reward: rewardName, dryRun: true });
      continue;
    }

    try {
      await otpSend(customer.phone);
      const proof = await otpVerify(customer.phone, config.devOtpCode);
      const loginPayload = await customerLogin(proof);
      const access0 = requireString(loginPayload.access_token, "customer access");
      const session = await customerSelectSession(
        access0,
        requireString(customer.enrollment_id, "enrollment_id"),
      );
      const customerToken = requireString(session.access_token, "customer scoped");

      const catalog = await customerListRewards(customerToken);
      const rows = asArray(catalog.rewards);
      const match =
        rows.find((r) => typeof r === "object" && r && r.id === rewardId && r.affordable === true) ??
        rows.find((r) => typeof r === "object" && r && r.affordable === true);
      const claimRewardId = requireString(
        typeof match === "object" && match && "id" in match ? String(match.id) : rewardId,
        "claim reward id",
      );

      const claim = await customerClaimReward(customerToken, claimRewardId);
      const claimQr = requireString(claim.claim_qr, "claim_qr");
      const displayCode =
        typeof claim.display_code === "string" ? claim.display_code : claimQr.slice(0, 12);

      log(`Validate redemption ${displayCode}`);
      await staffValidateRedemption(merchantToken, claimQr);

      outcomes.push({
        customer: customer.phone,
        reward: rewardName,
        display_code: displayCode,
        points_spent: claim.points_spent,
      });
    } catch (err) {
      console.warn(
        `  Claim skipped for ${customer.phone}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  if (outcomes.length === 0 && maxClaims > 0) {
    console.warn("  No claims completed (insufficient balance or OTP unavailable)");
  }
  return outcomes;
}

async function main() {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE} — copy backend/.env.example to backend/.env`);
    process.exit(1);
  }

  console.log(`Simulate loyalty @ ${config.apiBase} (tenant: ${config.tenantSlug})`);
  if (config.dryRun) {
    console.log("SIM_DRY_RUN=true — logging actions only, no API mutations");
  }
  await waitForApi();

  log(`Login merchant ${config.merchantEmail}`);
  const merchantSession = await loginScoped(
    config.merchantEmail,
    config.merchantPassword,
    config.tenantSlug,
  );
  const merchantToken = merchantSession.accessToken;

  const stores = await listOrgStores(merchantToken);
  const hq =
    stores.find((s) => typeof s === "object" && s && s.is_hq) ??
    stores.find((s) => typeof s === "object" && s && s.slug === "main") ??
    stores[0];
  const hqId = typeof hq === "object" && hq && typeof hq.id === "string" ? hq.id : "";
  const hqSlug = typeof hq === "object" && hq && typeof hq.slug === "string" ? hq.slug : "main";

  let scopedMerchantToken = merchantToken;
  if (hqId) {
    const scoped = await loginScoped(
      config.merchantEmail,
      config.merchantPassword,
      config.tenantSlug,
      hqId,
    );
    scopedMerchantToken = scoped.accessToken;
  }

  const storeQr = config.dryRun ? "dry-run-qr" : await getStoreQr(scopedMerchantToken);
  const beforeMetrics = config.dryRun ? {} : await getMetrics(scopedMerchantToken);

  /** @type {CustomerRow[]} */
  let customers = config.dryRun ? [] : await listCustomers(scopedMerchantToken);
  const rewards = config.dryRun ? [] : await listRewards(scopedMerchantToken);

  const enrolled = await simulateEnrollments(scopedMerchantToken, storeQr, config.newEnrollments);
  if (!config.dryRun && enrolled.length > 0) {
    customers = await listCustomers(scopedMerchantToken);
  }
  const customerPool = [
    ...enrolled.map((e) => ({
      enrollment_id: e.enrollment_id,
      phone: e.phone,
      name: e.name,
      customer_qr: e.customer_qr,
      points_balance: 0,
    })),
    ...customers.map((c) => (typeof c === "object" && c ? c : {})),
  ];

  let purchaseToken = scopedMerchantToken;
  const boutique =
    stores.find((s) => typeof s === "object" && s && s.slug && s.slug !== hqSlug && s.id) ??
    null;
  if (boutique && typeof boutique === "object" && boutique.id) {
    try {
      const agentSession = await loginScoped(
        config.agentEmail,
        config.agentPassword,
        config.tenantSlug,
        String(boutique.id),
      );
      purchaseToken = agentSession.accessToken;
      log(`Some purchases via agent @ ${boutique.slug ?? "boutique"}`);
    } catch {
      // agent optional
    }
  }

  const purchases = await simulatePurchases(purchaseToken, customerPool, config.purchases);

  if (!config.dryRun) {
    customers = await listCustomers(scopedMerchantToken);
  }
  const refreshedPool = customers.map((c) => (typeof c === "object" && c ? c : {}));

  const claims = await simulateClaims(
    scopedMerchantToken,
    refreshedPool,
    rewards,
    config.claims,
  );

  const afterMetrics = config.dryRun ? {} : await getMetrics(scopedMerchantToken);

  console.log("");
  console.log("Simulation summary:");
  console.log(`  Tenant:           ${config.tenantSlug}`);
  console.log(`  New enrollments:  ${enrolled.length}`);
  console.log(`  Purchases:        ${purchases.length}`);
  console.log(`  Claims validated: ${claims.length}`);
  if (!config.dryRun && beforeMetrics && afterMetrics) {
    console.log(
      `  Metrics: clients_today ${beforeMetrics.clients_served_today ?? "?"} → ${afterMetrics.clients_served_today ?? "?"}, ` +
        `pts_today ${beforeMetrics.points_issued_today ?? "?"} → ${afterMetrics.points_issued_today ?? "?"}, ` +
        `redemptions ${beforeMetrics.redemptions_today ?? "?"} → ${afterMetrics.redemptions_today ?? "?"}`,
    );
  }
  console.log("");
  console.log("Re-run anytime: pnpm dev:simulate");
  console.log("Tune volume: SIM_NEW_ENROLLMENTS=3 SIM_PURCHASES=8 SIM_CLAIMS=2 pnpm dev:simulate");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
