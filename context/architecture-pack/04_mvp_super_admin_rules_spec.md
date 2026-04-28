# MVP spec — Super-admin “Rules fidelity” (editor + tester + formula/JSON)

This spec describes the MVP capabilities for the **Portal Super Admin** to manage loyalty rules safely, inspired by:
- the “éditeur de règle” screen (blocks + natural language + “Voir JSON”)
- the “simulateur de test” screen (inputs + trace + KPIs)

## 1) MVP scope (explicit)

### In scope (MVP)
- **Rule trigger**: `TransactionRecorded` only.
- **Conditions (MVP)**:
  - amount thresholds (>=, >, <=, <, between)
  - day of week (Mon..Sun)
  - time window (e.g., 18:00–22:00)
  - channel (caisse, livraison, en ligne)
  - customer tier (Bronze/Argent/Or/Platine) — read-only from projections
- **Actions (MVP)**:
  - `SetBasePointsFormula` (global tenant setting or rule action; see below)
  - `MultiplyPoints(multiplier)` (bounded, e.g., 1–5)
  - `AddBonusPoints(points)` (bounded)
  - `RequestNotification(SMS|Push, templateId)` (optional, async; can be stubbed)
- **Rule lifecycle**: draft, validate, simulate, publish, activate/deactivate.
- **Versioning**: immutable published versions.
- **Simulation**:
  - single test case (interactive)
  - batch test (N=100, optional) with sampled contexts (synthetic if no history)

### Out of scope (MVP)
- product/item/category conditions (needs POS/cart data)
- customer segments builder
- complex reward unlocking flows (keep redemption simple)
- “rule scripting” / arbitrary code execution

## 2) Portal IA (information architecture) — screens

### A) “Bibliothèque de règles” (Rule Library)
- list of all rules (drafts + published)
- filters: tenant, status (draft/published/active), trigger
- columns: name, priority, status, last editor, last published at, active window
- actions:
  - create new draft
  - duplicate (from draft or published)
  - view diff (draft vs last published)
  - deactivate/activate (published)

### B) “Éditeur de règle” (visual builder)
Layout inspired by your screenshot:
- left palette:
  - triggers (only Transaction in MVP)
  - condition blocks
  - action blocks
- main canvas:
  - Trigger at top
  - Conditions section with AND/OR grouping
  - Actions section
- bottom panel:
  - natural language translation (“Lorsque… alors…”)
  - validation errors/warnings

#### Required UX affordances
- “Voir JSON” (canonical AST) toggle
- “Tester avec données” opens simulator prefilled
- live validation (type/operator constraints)
- rule metadata: name, priority, active window (optional), tags

### C) “Simulateur de test” (single-case + trace)
Inputs:
- tenant
- customer tier + current balance (or mock)
- transaction amount
- day of week
- time
- channel

Outputs:
- rule(s) triggered
- base points, multiplier applied, final points
- new balance
- trace of conditions (pass/fail) like your “chips”
- side-effect intents (e.g., SMS requested) without actually sending

### D) “Formule de points” (base formula editor)
MVP decision: keep it simple but explicit.

Option 1 (recommended MVP): tenant-level base formula:
- `basePoints = floor(amountFcfa / X)` where X is configurable per tenant.
- Reasons: easy to reason, aligns with cadrage “1 point per tranche de X FCFA”.

Option 2 (still safe): expression editor with allowlist:
- e.g., `floor(amountFcfa / 100) + (tier == "Or" ? 10 : 0)`
- Only if you want formula power immediately (more validation work).

For MVP, implement Option 1 but design the AST to allow Option 2 later.

## 3) Canonical Rule AST (conceptual)

Below is the conceptual structure (stored as JSON in DB; edited via blocks or “View JSON”).

```json
{
  "schemaVersion": 1,
  "name": "Double points weekend client Or+",
  "trigger": { "type": "TransactionRecorded" },
  "priority": 100,
  "activeWindow": { "start": null, "end": null },
  "conditions": {
    "op": "AND",
    "children": [
      { "op": "GTE", "left": { "var": "transaction.amountFcfa" }, "right": { "const": 2000 } },
      { "op": "IN", "left": { "var": "context.dayOfWeek" }, "right": { "const": ["Sat","Sun"] } },
      { "op": "IN", "left": { "var": "enrollment.tier" }, "right": { "const": ["Or","Platine"] } }
    ]
  },
  "actions": [
    { "type": "MultiplyPoints", "multiplier": 2 },
    { "type": "RequestNotification", "channel": "SMS", "templateId": "double_points_applied" }
  ]
}
```

## 4) Data model (conceptual tables)

### `rule_drafts`
- `id`, `tenant_id`, `name`, `definition_json`, `created_by`, `updated_at`, `status`

### `rule_versions`
- `id`, `tenant_id`, `version`, `name`, `definition_json`, `published_by`, `published_at`
- `active` flag + `active_start`, `active_end`
- `priority`

### `audit_log`
- captures:
  - draft created/updated
  - version published
  - version activated/deactivated

### `point_events`
- includes `rule_version_id` for explainability + audit.

## 5) API surface (conceptual endpoints)

Super-admin (tenant-scoped):
- `POST /tenants/{tenantId}/rules/drafts`
- `PUT /tenants/{tenantId}/rules/drafts/{draftId}`
- `POST /tenants/{tenantId}/rules/drafts/{draftId}/validate`
- `POST /tenants/{tenantId}/rules/drafts/{draftId}/simulate`
- `POST /tenants/{tenantId}/rules/drafts/{draftId}/publish`
- `POST /tenants/{tenantId}/rules/versions/{versionId}/activate`
- `POST /tenants/{tenantId}/rules/versions/{versionId}/deactivate`
- `GET /tenants/{tenantId}/rules` (library list)

Runtime (cashier):
- `POST /tenants/{tenantId}/transactions` with `Idempotency-Key`

## 6) MVP safety checks (must-have)

- **Validation gate**: cannot publish if validate fails.
- **Determinism gate**: reject unsupported functions/operators.
- **Caps**: multiplier max, bonus max, max points per transaction (tenant-level safety).
- **Idempotency**: enforced on transaction + redemption validation.
- **Dry-run notifications** in simulation (never send).

## 7) Mapping to diagrams (where it lives)

- Rule library/editor/simulator belong to **Portal Super Admin** → `Rules_Service_Authoring` (see `02_diagrams.md`).
- Published rule versions are read by `Rules_Runtime` during the earn flow.
- Outputs become `PointEvents` in the ledger and projections for fast reads.

