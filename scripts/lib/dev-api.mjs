/**
 * Shared helpers for dev-seed.mjs and simulate-loyalty.mjs.
 * Merchant admin flows use /v1/tenants/:tenantId/* (tenant-first API).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function parseEnvFile(path) {
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

export function env(key, fallback, envFile) {
  if (process.env[key] !== undefined && process.env[key] !== "") {
    return process.env[key];
  }
  const file = parseEnvFile(envFile);
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

export function resolveApiBase(envFile) {
  if (process.env.API_BASE) {
    return stripTrailingSlash(process.env.API_BASE);
  }
  const explicit = env("API_PUBLIC_BASE", "", envFile);
  if (explicit) {
    return stripTrailingSlash(explicit);
  }
  const fromFiles = portFromPublicFileBaseUrl(env("PUBLIC_FILE_BASE_URL", "", envFile));
  if (fromFiles) {
    return `http://localhost:${fromFiles}`;
  }
  const fromCompose = parseDockerBackendHostPort();
  if (fromCompose) {
    return `http://localhost:${fromCompose}`;
  }
  const httpPort = env("HTTP_PORT", "8082", envFile);
  if (httpPort === "8080") {
    return "http://localhost:8082";
  }
  return `http://localhost:${httpPort}`;
}

export function tenantPath(tenantId, segment) {
  const base = `/v1/tenants/${encodeURIComponent(tenantId)}`;
  if (!segment) return base;
  return segment.startsWith("/") ? `${base}${segment}` : `${base}/${segment}`;
}

/**
 * @param {string} apiBase
 * @param {string} method
 * @param {string} path
 * @param {{ headers?: Record<string, string>; body?: unknown; allowError?: boolean }} [opts]
 */
export async function api(apiBase, method, path, opts = {}) {
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = { accept: "application/json", ...opts.headers };
  let body;
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  /** @type {{ data?: unknown; error?: { code?: string; message?: string } } | null} */
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`${method} ${path}: invalid JSON (${res.status}): ${text.slice(0, 200)}`);
    }
  }
  if (!res.ok && !opts.allowError) {
    const details =
      json?.error && typeof json.error === "object" && "details" in json.error
        ? json.error.details
        : null;
    const reason =
      details && typeof details === "object" && details && "reason" in details
        ? String(details.reason)
        : "";
    const msg = json?.error?.message ?? text.slice(0, 200) ?? res.statusText;
    throw new Error(
      `${method} ${path} failed (${res.status}): ${msg}${reason ? ` [${reason}]` : ""}`,
    );
  }
  return { res, json, text };
}

export function data(json) {
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  return undefined;
}

export function asObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected object`);
  }
  return /** @type {Record<string, unknown>} */ (value);
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}: missing string value`);
  }
  return value.trim();
}

export function tenantIdFromPayload(payload, required = true) {
  const raw = typeof payload.tenant_id === "string" ? payload.tenant_id.trim() : "";
  if (raw) return raw;
  if (required) {
    throw new Error("tenant_id in session: missing string value");
  }
  return "";
}

/** Read a KPI value from GET /v1/tenants/:id/metrics (kpis[] keyed payload). */
export function metricsKpiValue(metrics, key) {
  const kpis = asArray(metrics?.kpis);
  const row = kpis.find((k) => typeof k === "object" && k && k.key === key);
  if (!row || typeof row !== "object") return undefined;
  return row.value;
}

export async function waitForApi(apiBase) {
  for (let i = 0; i < 30; i++) {
    try {
      const { json } = await api(apiBase, "GET", "/health", { allowError: true });
      if (json?.data && typeof json.data === "object" && json.data.status === "ok") {
        return;
      }
    } catch {
      // retry
    }
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`API not ready at ${apiBase}/health`);
}

export async function login(apiBase, email, password, preferredTenantSlug = "") {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await api(apiBase, "POST", "/v1/sessions", {
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
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const message = res.json?.error?.message ?? res.text.slice(0, 200);
    throw new Error(`POST /v1/sessions failed (${res.res.status}): ${String(message)}`);
  }
  throw new Error(`login retries exhausted for ${email}`);
}

export async function selectWorkspace(apiBase, accessToken, membershipId, activeStoreId = "") {
  const body = { membership_id: membershipId };
  if (activeStoreId) {
    body.active_store_id = activeStoreId;
  }
  const res = await api(apiBase, "PUT", "/v1/sessions/current/workspace", {
    headers: { authorization: `Bearer ${accessToken}` },
    body,
  });
  return asObject(data(res.json), `select workspace ${membershipId}`);
}

/** @typedef {{ accessToken: string; initialAccessToken: string; payload: Record<string, unknown>; workspaces: unknown[]; membershipId: string; tenantId: string }} ScopedSession */

/**
 * @param {string} apiBase
 * @param {string} email
 * @param {string} password
 * @param {string} [desiredTenantSlug]
 * @param {string} [activeStoreId]
 * @returns {Promise<ScopedSession>}
 */
export async function loginScoped(apiBase, email, password, desiredTenantSlug = "", activeStoreId = "") {
  const payload = await login(apiBase, email, password, desiredTenantSlug);
  const step = typeof payload.step === "string" ? payload.step : "ok";
  if (step === "mfa_required") {
    throw new Error(`Seed users should not require MFA (${email})`);
  }
  const initialAccessToken = requireString(payload.access_token, `initial access token for ${email}`);
  const workspaces = asArray(payload.workspaces);

  let scopedPayload = payload;
  let accessToken = initialAccessToken;
  let membershipId = typeof payload.membership_id === "string" ? payload.membership_id : "";

  if (step === "workspace_selection_required") {
    const workspace =
      (desiredTenantSlug
        ? workspaces.find(
            (row) => typeof row === "object" && row && row.tenant_slug === desiredTenantSlug,
          )
        : null) ?? (workspaces.length === 1 ? workspaces[0] : null);
    if (workspace && typeof workspace === "object") {
      membershipId = requireString(
        typeof workspace.membership_id === "string" ? workspace.membership_id : "",
        `membership_id for ${email}`,
      );
      scopedPayload = await selectWorkspace(apiBase, initialAccessToken, membershipId, activeStoreId);
      accessToken = requireString(scopedPayload.access_token, `scoped access token for ${email}`);
    } else if (desiredTenantSlug) {
      throw new Error(`No workspace found for ${email} in ${desiredTenantSlug}`);
    }
  } else if (activeStoreId && membershipId) {
    scopedPayload = await selectWorkspace(apiBase, initialAccessToken, membershipId, activeStoreId);
    accessToken = requireString(scopedPayload.access_token, `store-scoped token for ${email}`);
  }

  return {
    accessToken,
    initialAccessToken,
    payload: scopedPayload,
    workspaces,
    membershipId,
    tenantId: tenantIdFromPayload(scopedPayload, Boolean(desiredTenantSlug || activeStoreId)),
  };
}

// --- Tenant admin API (merchant /store portal) ---

export async function tenantGetSettings(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "settings"), {
    headers: { authorization: `Bearer ${token}` },
  });
  return asObject(data(res.json), "tenant settings");
}

export async function tenantPatchSettings(apiBase, token, tenantId, body) {
  await api(apiBase, "PATCH", tenantPath(tenantId, "settings"), {
    headers: { authorization: `Bearer ${token}` },
    body,
  });
}

export async function tenantListCustomers(apiBase, token, tenantId, query = {}) {
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  const res = await api(apiBase, "GET", `${tenantPath(tenantId, "customers")}${qs ? `?${qs}` : ""}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const payload = asObject(data(res.json), "tenant customers");
  return asArray(payload.customers);
}

export async function tenantGetQrToken(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "enrollment-qr"), {
    headers: { authorization: `Bearer ${token}` },
  });
  return requireString(asObject(data(res.json), "qr token").store_qr, "store_qr");
}

export async function tenantGetMetrics(apiBase, token, tenantId, query = {}) {
  const params = new URLSearchParams();
  if (query.period) params.set("period", query.period);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.locationId) params.set("location_id", query.locationId);
  const qs = params.toString();
  const res = await api(apiBase, "GET", `${tenantPath(tenantId, "metrics")}${qs ? `?${qs}` : ""}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return asObject(data(res.json), "tenant metrics");
}

export async function tenantGetStats(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "stats"), {
    headers: { authorization: `Bearer ${token}` },
  });
  return asObject(data(res.json), "tenant stats");
}

export async function tenantListTransactions(apiBase, token, tenantId, query = {}) {
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));
  const qs = params.toString();
  const res = await api(
    apiBase,
    "GET",
    `${tenantPath(tenantId, "transactions")}${qs ? `?${qs}` : ""}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const payload = asObject(data(res.json), "tenant transactions");
  return asArray(payload.transactions);
}

export async function tenantListRules(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "rules"), {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(asObject(data(res.json), "tenant rules").rules);
}

export async function tenantCreateRule(apiBase, token, tenantId, rule, opts = {}) {
  const priority = typeof opts === "number" ? opts : (opts.priority ?? 0);
  const summary = typeof opts === "object" && opts && "summary" in opts ? opts.summary : undefined;
  await api(apiBase, "POST", tenantPath(tenantId, "rules"), {
    headers: { authorization: `Bearer ${token}` },
    body: { rule, priority, active: true, ...(summary ? { summary } : {}) },
  });
}

export async function tenantGetRulesHealth(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "rules/health"), {
    headers: { authorization: `Bearer ${token}` },
  });
  return asObject(data(res.json), "rules health");
}

export async function tenantListRewards(apiBase, token, tenantId, activeOnly = false) {
  const qs = activeOnly ? "" : "?active_only=false";
  const res = await api(apiBase, "GET", `${tenantPath(tenantId, "rewards")}${qs}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(asObject(data(res.json), "tenant rewards").rewards);
}

export async function tenantCreateReward(apiBase, token, tenantId, reward) {
  const res = await api(apiBase, "POST", tenantPath(tenantId, "rewards"), {
    headers: { authorization: `Bearer ${token}` },
    body: { ...reward, active: true },
  });
  return asObject(data(res.json), "create reward");
}

export async function tenantCreateInvitation(apiBase, token, tenantId, email, role) {
  const res = await api(apiBase, "POST", tenantPath(tenantId, "invitations"), {
    headers: { authorization: `Bearer ${token}` },
    body: { email, role },
  });
  return asObject(data(res.json), `invitation ${email}`);
}

export async function tenantCreateCampaign(apiBase, token, tenantId, campaign) {
  const res = await api(apiBase, "POST", tenantPath(tenantId, "campaigns"), {
    headers: { authorization: `Bearer ${token}` },
    body: campaign,
  });
  return asObject(data(res.json), "create campaign");
}

export async function tenantListCampaigns(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "campaigns"), {
    headers: { authorization: `Bearer ${token}` },
    allowError: true,
  });
  if (!res.res.ok) return [];
  return asArray(asObject(data(res.json), "campaigns").campaigns);
}

export async function tenantAnalyticsOverview(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", `${tenantPath(tenantId, "analytics/overview")}?period=30d`, {
    headers: { authorization: `Bearer ${token}` },
    allowError: true,
  });
  if (!res.res.ok) return null;
  return asObject(data(res.json), "analytics overview");
}

export async function tenantGetQrBranding(apiBase, token, tenantId) {
  const res = await api(apiBase, "GET", tenantPath(tenantId, "qr/branding"), {
    headers: { authorization: `Bearer ${token}` },
    allowError: true,
  });
  if (!res.res.ok) return null;
  return asObject(data(res.json), "qr branding");
}

/**
 * Smoke-read tenant admin endpoints used by /store (settings, stats, ledger, analytics, QR).
 * @param {string} apiBase
 * @param {string} token
 * @param {string} tenantId
 * @param {string} [label]
 */
export async function tenantAdminSmoke(apiBase, token, tenantId, label = "") {
  const prefix = label ? `[${label}] ` : "";
  const settings = await tenantGetSettings(apiBase, token, tenantId);
  const stats = await tenantGetStats(apiBase, token, tenantId);
  const metrics = await tenantGetMetrics(apiBase, token, tenantId, { period: "7d" });
  const customers = await tenantListCustomers(apiBase, token, tenantId, { limit: 5 });
  const transactions = await tenantListTransactions(apiBase, token, tenantId, { limit: 5 });
  const rules = await tenantListRules(apiBase, token, tenantId);
  const rulesHealth = await tenantGetRulesHealth(apiBase, token, tenantId);
  const rewards = await tenantListRewards(apiBase, token, tenantId, true);
  const qrToken = await tenantGetQrToken(apiBase, token, tenantId);
  const branding = await tenantGetQrBranding(apiBase, token, tenantId);
  const campaigns = await tenantListCampaigns(apiBase, token, tenantId);
  const analytics = await tenantAnalyticsOverview(apiBase, token, tenantId);

  return {
    label,
    settingsName: typeof settings.name === "string" ? settings.name : "",
    stats,
    metrics,
    customerCount: customers.length,
    transactionSample: transactions.length,
    ruleCount: rules.length,
    rulesProgramActive: rulesHealth.program_active === true,
    rewardCount: rewards.length,
    hasQrToken: Boolean(qrToken),
    hasBranding: Boolean(branding),
    campaignCount: campaigns.length,
    hasAnalytics: Boolean(analytics),
    logLine: `${prefix}tenant API ok — settings=${settings.name ?? "?"} customers≥${customers.length} tx≥${transactions.length} rules=${rules.length} program_active=${rulesHealth.program_active === true} rewards=${rewards.length} campaigns=${campaigns.length}`,
  };
}
