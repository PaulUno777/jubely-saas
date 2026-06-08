#!/usr/bin/env node
/**
 * Simulate normal daily loyalty activity against a running API.
 *
 * Run after `pnpm dev:seed` so tenants, rules, and rewards exist.
 *
 * Each run typically:
 * - smoke-reads tenant admin APIs (settings, stats, metrics, analytics, QR)
 * - enrolls new walk-in customers (public QR + staff enroll)
 * - records purchases (merchant or agent-scoped boutique)
 * - claims an affordable reward and staff-validates when balance allows
 *
 * Merchant reads use /v1/tenants/:tenantId/* (tenant-first API).
 *
 * Optional env: API_BASE, TENANT_SLUG, SIM_NEW_ENROLLMENTS, SIM_PURCHASES, SIM_CLAIMS, SIM_DRY_RUN
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
  tenantGetMetrics,
  tenantGetQrToken,
  tenantListCustomers,
  tenantListRewards,
  tenantListTransactions,
  waitForApi,
} from "./lib/dev-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = process.env.ENV_FILE ?? join(ROOT, "backend", ".env");

const config = {
  apiBase: resolveApiBase(ENV_FILE),
  dryRun: env("SIM_DRY_RUN", "", ENV_FILE) === "true",
  devOtpCode: env("DEV_OTP_CODE", env("PUBLIC_OTP_DEV_CODE", "000000", ENV_FILE), ENV_FILE),
  tenantSlug: env("TENANT_SLUG", "chez-mama", ENV_FILE),
  merchantEmail: env("MERCHANT_EMAIL", "merchant@chezmama.local", ENV_FILE),
  merchantPassword: env("MERCHANT_PASSWORD", "MerchantAdmin123!", ENV_FILE),
  agentEmail: env("AGENT_EMAIL", "agent.multi@jubely.local", ENV_FILE),
  agentPassword: env("AGENT_PASSWORD", "AgentStaff123!", ENV_FILE),
  newEnrollments: Math.max(0, Number(env("SIM_NEW_ENROLLMENTS", "2", ENV_FILE))),
  purchases: Math.max(0, Number(env("SIM_PURCHASES", "5", ENV_FILE))),
  claims: Math.max(0, Number(env("SIM_CLAIMS", "1", ENV_FILE))),
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

function callApi(method, path, opts = {}) {
  return api(config.apiBase, method, path, opts);
}

async function listTenantLocations(token, tenantId) {
  const res = await callApi("GET", `/v1/tenants/${encodeURIComponent(tenantId)}/locations`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return asArray(asObject(data(res.json), "locations").locations);
}

async function publicEnroll(storeQr, customer) {
  const res = await callApi("POST", "/v1/public/enrollments", {
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
  const res = await callApi("POST", "/v1/staff/customers", {
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
  const res = await callApi("POST", "/v1/staff/transactions", {
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
  const res = await callApi("POST", "/v1/public/phone-verifications", { body: { phone_e164: phone } });
  const payload = asObject(data(res.json), "otp send");
  return requireString(payload.id, "verification_id");
}

async function otpVerify(verificationId, code) {
  const res = await callApi(
    "POST",
    `/v1/public/phone-verifications/${encodeURIComponent(verificationId)}/confirmations`,
    { body: { code } },
  );
  return requireString(asObject(data(res.json), "otp").phone_verify_token, "phone_verify_token");
}

async function customerLogin(phoneVerifyToken) {
  const res = await callApi("POST", "/v1/customer-sessions", {
    body: { phone_verify_token: phoneVerifyToken },
  });
  return asObject(data(res.json), "customer login");
}

async function customerSelectSession(accessToken, enrollmentId) {
  const res = await callApi("PUT", "/v1/customer-sessions/current", {
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
  const res = await callApi("POST", "/v1/customers/me/reward-claims", {
    headers: { authorization: `Bearer ${accessToken}` },
    body: { reward_id: rewardId },
  });
  return asObject(data(res.json), "claim");
}

async function staffValidateRedemption(token, claimQr) {
  const res = await callApi("POST", "/v1/staff/redemption-validations", {
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
      const verificationId = await otpSend(customer.phone);
      const proof = await otpVerify(verificationId, config.devOtpCode);
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

  log(`Health check ${config.apiBase}/health`);
  try {
    await waitForApi(config.apiBase);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    console.error("Run the API first, then `pnpm dev:seed` if the tenant is missing.");
    process.exit(1);
  }

  log(`Login merchant ${config.merchantEmail}`);
  const merchantSession = await loginScoped(
    config.apiBase,
    config.merchantEmail,
    config.merchantPassword,
    config.tenantSlug,
  );
  const merchantToken = merchantSession.accessToken;
  const tenantId = merchantSession.tenantId;

  const stores = await listTenantLocations(merchantToken, tenantId);
  const hq =
    stores.find((s) => typeof s === "object" && s && s.is_hq) ??
    stores.find((s) => typeof s === "object" && s && s.slug === "main") ??
    stores[0];
  const hqId = typeof hq === "object" && hq && typeof hq.id === "string" ? hq.id : "";
  const hqSlug = typeof hq === "object" && hq && typeof hq.slug === "string" ? hq.slug : "main";

  let scopedMerchantToken = merchantToken;
  if (hqId) {
    const scoped = await loginScoped(
      config.apiBase,
      config.merchantEmail,
      config.merchantPassword,
      config.tenantSlug,
      hqId,
    );
    scopedMerchantToken = scoped.accessToken;
  }

  if (!config.dryRun) {
    const smoke = await tenantAdminSmoke(config.apiBase, scopedMerchantToken, tenantId, config.tenantSlug);
    log(smoke.logLine);
  }

  const storeQr = config.dryRun
    ? "dry-run-qr"
    : await tenantGetQrToken(config.apiBase, scopedMerchantToken, tenantId);
  const beforeMetrics = config.dryRun
    ? {}
    : await tenantGetMetrics(config.apiBase, scopedMerchantToken, tenantId, { period: "7d" });

  /** @type {CustomerRow[]} */
  let customers = config.dryRun
    ? []
    : await tenantListCustomers(config.apiBase, scopedMerchantToken, tenantId, { limit: 200 });
  const rewards = config.dryRun
    ? []
    : await tenantListRewards(config.apiBase, scopedMerchantToken, tenantId, true);

  const enrolled = await simulateEnrollments(scopedMerchantToken, storeQr, config.newEnrollments);
  if (!config.dryRun && enrolled.length > 0) {
    customers = await tenantListCustomers(config.apiBase, scopedMerchantToken, tenantId, { limit: 200 });
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
    stores.find((s) => typeof s === "object" && s && s.slug && s.slug !== hqSlug && s.id) ?? null;
  if (boutique && typeof boutique === "object" && boutique.id) {
    try {
      const agentSession = await loginScoped(
        config.apiBase,
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
    customers = await tenantListCustomers(config.apiBase, scopedMerchantToken, tenantId, { limit: 200 });
  }
  const refreshedPool = customers.map((c) => (typeof c === "object" && c ? c : {}));

  const claims = await simulateClaims(scopedMerchantToken, refreshedPool, rewards, config.claims);

  const afterMetrics = config.dryRun
    ? {}
    : await tenantGetMetrics(config.apiBase, scopedMerchantToken, tenantId, { period: "7d" });

  let txSample = 0;
  if (!config.dryRun) {
    const tx = await tenantListTransactions(config.apiBase, scopedMerchantToken, tenantId, {
      limit: 10,
    });
    txSample = tx.length;
  }

  console.log("");
  console.log("Simulation summary:");
  console.log(`  Tenant:           ${config.tenantSlug} (${tenantId})`);
  console.log(`  API:              /v1/tenants/:id/* (merchant portal)`);
  console.log(`  New enrollments:  ${enrolled.length}`);
  console.log(`  Purchases:        ${purchases.length}`);
  console.log(`  Claims validated: ${claims.length}`);
  if (!config.dryRun) {
    console.log(`  Ledger sample:    ${txSample} recent transactions`);
  }
  if (!config.dryRun && beforeMetrics && afterMetrics) {
    console.log(
      `  Metrics (7d): active_customers ${metricsKpiValue(beforeMetrics, "active_customers") ?? "?"} → ${metricsKpiValue(afterMetrics, "active_customers") ?? "?"}, ` +
        `points_distributed ${metricsKpiValue(beforeMetrics, "points_distributed") ?? "?"} → ${metricsKpiValue(afterMetrics, "points_distributed") ?? "?"}, ` +
        `rewards_validated ${metricsKpiValue(beforeMetrics, "rewards_validated") ?? "?"} → ${metricsKpiValue(afterMetrics, "rewards_validated") ?? "?"}`,
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
