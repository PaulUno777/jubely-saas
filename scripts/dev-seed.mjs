#!/usr/bin/env node
/**
 * Local dev seed: superadmin → tenant → merchant admin → agent → customer → purchase.
 *
 * Requires API running and backend/.env with BOOTSTRAP_SECRET.
 * Env overrides: API_BASE, WEB_ORIGIN, SUPER_EMAIL, TENANT_SLUG, etc.
 */

import { readFileSync, existsSync } from "node:fs";
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

/** Host port published for backend in docker-compose (e.g. 8082:8080 → 8082). */
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

/**
 * API origin for requests from the host machine.
 * HTTP_PORT in backend/.env is the in-container listen port (8080), not the published port (8082).
 */
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
  superEmail: env("SUPER_EMAIL", "super@jubely.local"),
  superPassword: env("SUPER_PASSWORD", "SuperAdmin123!"),
  tenantName: env("TENANT_NAME", "Chez Mama"),
  tenantSlug: env("TENANT_SLUG", "chez-mama"),
  merchantEmail: env("MERCHANT_EMAIL", "merchant@chezmama.local"),
  merchantPassword: env("MERCHANT_PASSWORD", "MerchantAdmin123!"),
  agentEmail: env("AGENT_EMAIL", "agent@chezmama.local"),
  agentPassword: env("AGENT_PASSWORD", "AgentStaff123!"),
  customerName: env("CUSTOMER_NAME", "Awa Diop"),
  customerPhone: env("CUSTOMER_PHONE", "+237611111111"),
  customerEmail: env("CUSTOMER_EMAIL", "awa@example.com"),
  purchaseAmountFcfa: Number(env("PURCHASE_AMOUNT_FCFA", "4500")),
};

function log(step) {
  console.log(`→ ${step}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @typedef {{ data?: unknown; error?: { code?: string; message?: string } }} ApiEnvelope */

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

async function waitForApi() {
  log(`Health check ${config.apiBase}/health`);
  for (let i = 0; i < 30; i++) {
    try {
      const { json } = await api("GET", "/health", { allowError: true });
      if (json?.data && typeof json.data === "object" && json.data.status === "ok") {
        return;
      }
    } catch {
      /* retry */
    }
    if (i > 0) await sleep(1000);
  }
  let last = "";
  try {
    const r = await fetch(`${config.apiBase}/health`);
    last = await r.text();
  } catch (e) {
    last = String(e);
  }
  console.error(`API not ready at ${config.apiBase}/health`);
  console.error("Last response:", last.slice(0, 500));
  console.error("Tip: cd backend && go run ./cmd/api  (check HTTP_PORT in backend/.env)");
  process.exit(1);
}

/**
 * @param {unknown} json
 */
function data(json) {
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  return undefined;
}

async function main() {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE} — copy backend/.env.example to backend/.env`);
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
  const superLogin = await api("POST", "/v1/auth/login", {
    body: { email: config.superEmail, password: config.superPassword },
  });
  const superToken = /** @type {{ access_token?: string }} */ (data(superLogin.json))?.access_token;
  if (!superToken) {
    console.error("Superadmin login failed:", JSON.stringify(superLogin.json, null, 2));
    process.exit(1);
  }

  log(`Create tenant ${config.tenantName} (${config.tenantSlug})`);
  const tenantCreate = await api("POST", "/v1/superadmin/tenants", {
    allowError: true,
    headers: { authorization: `Bearer ${superToken}` },
    body: { name: config.tenantName, slug: config.tenantSlug, plan: "starter" },
  });
  const tenantPayload = /** @type {{ tenant_id?: string; id?: string }} */ (
    data(tenantCreate.json)
  );
  let tenantId = tenantPayload?.tenant_id ?? tenantPayload?.id ?? "";

  if (!tenantId) {
    const list = await api("GET", "/v1/superadmin/tenants?limit=1", {
      headers: { authorization: `Bearer ${superToken}` },
    });
    const rows = /** @type {Array<{ tenant_id?: string }>} */ (data(list.json));
    tenantId = rows?.[0]?.tenant_id ?? "";
  }
  if (!tenantId) {
    console.error("Could not resolve tenant id:", JSON.stringify(tenantCreate.json, null, 2));
    process.exit(1);
  }

  async function inviteAndAccept(auth, email, role, password, invPath) {
    const inv = await api("POST", invPath, {
      headers: { authorization: `Bearer ${auth}` },
      body: { email, role },
    });
    const token = /** @type {{ token?: string }} */ (data(inv.json))?.token;
    if (!token) {
      throw new Error(`Invitation failed for ${email}: ${JSON.stringify(inv.json)}`);
    }
    await api("POST", `/v1/invitations/${encodeURIComponent(token)}/accept`, {
      body: { password },
    });
  }

  log("Invite merchant admin");
  await inviteAndAccept(
    superToken,
    config.merchantEmail,
    "merchant_admin",
    config.merchantPassword,
    `/v1/superadmin/tenants/${tenantId}/invitations`,
  );

  log("Login merchant, invite agent");
  const merchantLogin = await api("POST", "/v1/auth/login", {
    body: {
      email: config.merchantEmail,
      password: config.merchantPassword,
      tenant_slug: config.tenantSlug,
    },
  });
  const merchantToken = /** @type {{ access_token?: string }} */ (data(merchantLogin.json))?.access_token;
  if (!merchantToken) {
    console.error("Merchant login failed:", JSON.stringify(merchantLogin.json, null, 2));
    process.exit(1);
  }

  log("Accept agent invitation");
  await inviteAndAccept(
    merchantToken,
    config.agentEmail,
    "staff",
    config.agentPassword,
    "/v1/store/invitations",
  );

  log("Agent creates customer");
  const agentLogin = await api("POST", "/v1/auth/login", {
    body: {
      email: config.agentEmail,
      password: config.agentPassword,
      tenant_slug: config.tenantSlug,
    },
  });
  const agentToken = /** @type {{ access_token?: string }} */ (data(agentLogin.json))?.access_token;
  if (!agentToken) {
    console.error("Agent login failed:", JSON.stringify(agentLogin.json, null, 2));
    process.exit(1);
  }

  const customerResp = await api("POST", "/v1/staff/customers", {
    headers: { authorization: `Bearer ${agentToken}` },
    body: {
      name: config.customerName,
      phone_e164: config.customerPhone,
      email: config.customerEmail,
    },
  });

  const points = Math.floor(config.purchaseAmountFcfa / 500);
  log(`Record sample purchase (${config.purchaseAmountFcfa} FCFA → ${points} pts)`);
  const purchaseResp = await api("POST", "/v1/staff/purchases", {
    headers: { authorization: `Bearer ${agentToken}` },
    body: {
      phone_e164: config.customerPhone,
      amount_fcfa: config.purchaseAmountFcfa,
    },
  });

  const { webOrigin } = config;
  const { tenantSlug } = config;
  console.log("");
  console.log(`Done. Web app (${webOrigin}):`);
  console.log(`  Login        ${webOrigin}/login`);
  console.log(
    `  Superadmin   email=${config.superEmail}  password=${config.superPassword}  (leave store slug empty) → /root`,
  );
  console.log(
    `  Merchant     email=${config.merchantEmail}  password=${config.merchantPassword}  slug=${tenantSlug} → /store`,
  );
  console.log(
    `  Agent        email=${config.agentEmail}  password=${config.agentPassword}  slug=${tenantSlug} → /agent`,
  );
  console.log(`  Join (PWA)   ${webOrigin}/join/${tenantSlug}`);
  console.log(`  Wallet (PWA) ${webOrigin}/customer/wallet  (save customer_qr in browser after join)`);
  console.log(`  Store lists  ${webOrigin}/store/customers  ${webOrigin}/store/transactions`);
  console.log("");
  console.log("API (direct Go, not BFF cookies):");
  console.log(`  Base URL     ${config.apiBase}`);
  console.log(`  Tenant id    ${tenantId}`);
  console.log(`  Customer     ${config.customerName} ${config.customerPhone}`);
  console.log("");
  console.log("Web env tip: set COOKIE_SECURE=false in apps/web/.env.local for http://localhost login.");
  console.log("");
  console.log("Customer enroll response:");
  console.log(JSON.stringify(data(customerResp.json), null, 2));
  console.log("");
  console.log("Purchase response:");
  console.log(JSON.stringify(data(purchaseResp.json), null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
