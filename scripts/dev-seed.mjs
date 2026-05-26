#!/usr/bin/env node
/**
 * Local dev seed for the global auth + membership flow.
 *
 * Seeds:
 * - one superadmin
 * - many stores
 * - one merchant admin per store
 * - one shared staff account across several stores (workspace picker)
 * - one customer enrolled in many stores (multi-program loyalty)
 * - one worker-as-customer case in a different store
 *
 * Requires the API to be running and backend/.env to contain BOOTSTRAP_SECRET.
 * Optional env overrides: API_BASE, WEB_ORIGIN, SUPER_EMAIL, TENANT_NAME, TENANT_SLUG, etc.
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

const stores = [
  {
    name: config.tenantName,
    slug: config.tenantSlug,
    merchantEmail: config.merchantEmail,
    merchantPassword: config.merchantPassword,
    purchaseAmountFcfa: config.purchaseAmountFcfa,
    includeSharedAgent: true,
  },
  {
    name: "Maison Naka",
    slug: "maison-naka",
    merchantEmail: "merchant.maison-naka@jubely.local",
    merchantPassword: "MerchantMaison123!",
    purchaseAmountFcfa: 6200,
    includeSharedAgent: true,
  },
  {
    name: "Bantu Coffee",
    slug: "bantu-coffee",
    merchantEmail: "merchant.bantu-coffee@jubely.local",
    merchantPassword: "MerchantBantu123!",
    purchaseAmountFcfa: 7800,
    includeSharedAgent: true,
  },
  {
    name: "Le Marche",
    slug: "le-marche",
    merchantEmail: "merchant.le-marche@jubely.local",
    merchantPassword: "MerchantMarche123!",
    purchaseAmountFcfa: 9100,
    includeSharedAgent: true,
  },
  {
    name: "Atelier Sawa",
    slug: "atelier-sawa",
    merchantEmail: "merchant.atelier-sawa@jubely.local",
    merchantPassword: "MerchantSawa123!",
    purchaseAmountFcfa: 5400,
    includeSharedAgent: false,
  },
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
 * @typedef {{ enrollment_id?: string; phone?: string; name?: string }} StoreCustomerRow
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

function pointsForAmount(amountFcfa) {
  return Math.floor(amountFcfa / 500);
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

async function ensurePwaEnrollment(merchantAuthToken, storeQr, customer) {
  if (config.publicEnrollRequirePhoneVerify && !customer.phoneVerifyToken) {
    throw new Error(
      `PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY=true requires a phone proof token for ${customer.phone}. Set CUSTOMER_PHONE_VERIFY_TOKEN / WORKER_CUSTOMER_PHONE_VERIFY_TOKEN.`,
    );
  }
  const res = await api("POST", "/v1/pwa/enrollments/scan", {
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
    return asObject(existing, `existing enrollment for ${customer.phone}`);
  }
  const message =
    res.json?.error?.message ??
    res.text.slice(0, 200) ??
    `could not ensure enrollment for ${customer.phone}`;
  throw new Error(String(message));
}

async function recordPurchase(authToken, phone, amountFcfa) {
  const res = await api("POST", "/v1/staff/purchases", {
    headers: { authorization: `Bearer ${authToken}` },
    body: {
      phone_e164: phone,
      amount_fcfa: amountFcfa,
    },
  });
  return asObject(data(res.json), `purchase ${phone}`);
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

  /** @type {Array<{ storeSlug: string; enrollmentId: string; points: number }>} */
  const mainCustomerPrograms = [];

  for (const store of seededStores) {
    const storeQr = await getStoreQr(store.merchantToken);

    log(`Enroll shared customer in ${store.slug}`);
    const enrolled = await ensurePwaEnrollment(store.merchantToken, storeQr, {
      name: config.customerName,
      phone: config.customerPhone,
      email: config.customerEmail,
      phoneVerifyToken: config.customerPhoneVerifyToken || undefined,
    });

    log(`Record purchase in ${store.slug}`);
    await recordPurchase(store.merchantToken, config.customerPhone, store.purchaseAmountFcfa);

    mainCustomerPrograms.push({
      storeSlug: store.slug,
      enrollmentId: requireString(enrolled.enrollment_id, `enrollment id for ${store.slug}`),
      points: pointsForAmount(store.purchaseAmountFcfa),
    });
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
  await recordPurchase(crossTenantStore.merchantToken, config.workerCustomerPhone, 3900);

  console.log("");
  console.log(`Done. Web app (${config.webOrigin}):`);
  console.log(`  Login:       ${config.webOrigin}/login`);
  console.log(
    `  Superadmin:  email=${config.superEmail}  password=${config.superPassword}  -> /root`,
  );
  console.log("");
  console.log("  Merchant admins (single workspace, no slug needed):");
  for (const store of seededStores) {
    console.log(
      `    ${store.slug}: email=${store.merchantEmail}  password=${store.merchantPassword}  -> /store`,
    );
  }
  console.log("");
  console.log(
    `  Shared staff (workspace picker): email=${config.agentEmail}  password=${config.agentPassword}  -> /agent`,
  );
  console.log(
    `    Workspaces: ${sharedAgentWorkspaces.map((row) => row.tenant_slug).filter(Boolean).join(", ")}`,
  );
  console.log("");
  console.log(
    `  Multi-program customer: ${config.customerName}  phone=${config.customerPhone}  email=${config.customerEmail}`,
  );
  console.log(
    `    Enrolled stores: ${mainCustomerPrograms.map((row) => row.storeSlug).join(", ")}`,
  );
  console.log(
    `    Open /login -> "Loyalty card", request OTP, then switch programs from wallet/stores.`,
  );
  console.log("");
  console.log(
    `  Worker as customer in another store: ${config.workerCustomerName}  phone=${config.workerCustomerPhone}  email=${config.agentEmail}`,
  );
  console.log(
    `    Customer store: ${crossTenantStore.slug}  enrollment_id=${requireString(workerCustomerEnrollment.enrollment_id, "worker customer enrollment")}`,
  );
  console.log("");
  console.log("  Join pages:");
  for (const store of seededStores) {
    console.log(`    ${store.slug}: ${config.webOrigin}/join/${store.slug}`);
  }
  console.log("");
  console.log("API seed summary:");
  console.log(`  Base URL:      ${config.apiBase}`);
  console.log(`  Store count:   ${seededStores.length}`);
  console.log(`  Main customer: ${mainCustomerPrograms.length} loyalty enrollments`);
  console.log("");
  console.log("Tips:");
  console.log("  - Set COOKIE_SECURE=false in apps/web/.env.local for local http cookies.");
  console.log("  - Set PUBLIC_OTP_LOG_CODE=true in backend/.env to print OTP codes in dev logs.");
  console.log("  - The old customer_qr-only flow is no longer required for seeded customer sessions.");
  console.log("");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
