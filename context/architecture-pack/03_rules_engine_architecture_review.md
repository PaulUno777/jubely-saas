# Rules engine + points architecture review (conceptual)

This document focuses on the **hardest part** of Jubely: **rules-driven point accumulation** with strong **auditability** and safe evolution over time.

## Non-negotiable properties (success criteria)

- **Deterministic evaluation**: same inputs → same outputs (points/events) across time.
- **Idempotency**: retrying the same cashier request must not double-credit points.
- **Auditability**: every balance is explainable from immutable events + rule versions.
- **Evolvability**: rules can change without corrupting history; changes are versioned and testable.
- **Performance under low-cost infra**: evaluation is fast; projections avoid heavy recomputation on read paths.

## Decision set (and rationale)

### 1) Canonical rule representation: JSON/AST (not arbitrary code)
**Decision**: rules are stored as a **validated Rule AST** (JSON) with a fixed set of operators, functions, and types.

**Why**
- Prevents untrusted execution (no “eval”, no scripts).
- Enables validation (type-check), diffing, versioning, and migration.
- Keeps runtime deterministic and bounded.

**Consequence**
- Rules are less “expressive” than a general language, but safer and scalable.

### 2) Rule authoring UX: block builder + “View JSON” backed by the same AST
**Decision**: the visual editor and formula/JSON view both manipulate the **same underlying AST**.

**Why**
- Matches your inspiration screens: blocks + “Voir JSON”.
- Lets power-users debug/adjust precisely while keeping guardrails.

### 3) Published rules are immutable; drafts are mutable
**Decision**:
- Draft: can be edited.
- Published RuleVersion: **immutable**, with explicit activation/deactivation.

**Why**
- You can reproduce historical outcomes: you always know *which version* generated which events.
- Safe rollback: deactivate a bad version and reactivate the prior one.

### 4) Execution model: synchronous crediting + optional async side-effects
**Decision**:
- “Earn points” runs synchronously to respond to cashier immediately.
- Notifications and heavy analytics are async (worker).

**Why**
- Cashier UX requires instant feedback.
- Avoids latency spikes and SMS provider failures blocking checkout.

### 5) Event sourcing boundary: the points ledger only
**Decision**: apply event sourcing strictly for **PointEvents** (earn/burn/adjust), not for the entire system.

**Why**
- Aligns with your cadrage doc: maximize robustness where it matters most.
- Limits complexity to the domain that truly needs it.

## Rule lifecycle (safe change management)

### Draft → Validate
Validation should fail fast and return actionable errors for the editor UI.

- **Schema validation**: required fields present, unknown fields rejected.
- **Type checking**: each operand/function returns the expected type (number/bool/string/date).
- **Operator allowlist**: only permitted comparisons and math operators.
- **Determinism constraints**:
  - No random, no network calls, no “now()” unless explicitly provided in context.
  - Any time-based logic must use `transaction.occurredAt` / `context.timestamp`.
- **Resource limits**: max nodes in AST, max nesting depth, max list sizes.
- **Side-effect restrictions**: actions must be representable as events (e.g., “enqueue SMS” is a queued intent, not executed inline).

### Validate → Simulate
Simulation is a **read-only** evaluation with full explainability.

- **Single test**: one context, show:
  - triggered/not triggered rules
  - points base / multipliers / final points
  - which conditions passed/failed (trace)
- **Batch test**: sample \(N\) contexts (synthetic or historical) to estimate:
  - trigger rate
  - expected points issued
  - distribution by segment/tier

**Important**: simulation uses **exactly the same runtime evaluator** as production, only with a read-only persistence adapter.

### Simulate → Publish
Publishing creates an immutable **RuleVersion**.

- **Immutability**: after publish, only activation flags/metadata change; the definition never does.
- **Version numbering**: per-tenant monotonic integer or semantic version.
- **Compatibility**: keep a `schemaVersion` in RuleVersion so future rule syntax migrations are explicit.

### Publish → Activate
Activation chooses which rule versions are “effective” for runtime.

- **Effective window**: optional start/end timestamps (helps with promos like “weekend double points”).
- **Priority**: ordering when multiple rules match.
- **Conflict strategy**: how to combine actions when multiple rules trigger:
  - additive bonuses + one multiplicative multiplier cap, or
  - “first match wins”, or
  - “all match apply” with guardrails.

For MVP, prefer **simple deterministic combination**:
- Compute `basePoints` once (e.g., \(amount / X\)).
- Apply at most one `multiplier` (highest priority matching rule).
- Add `bonusPoints` from matching rules (capped).

## Runtime evaluation model (how points are computed)

### EvaluationContext (inputs)
The evaluator should only rely on data carried in the context:
- **Tenant**: id, plan, settings.
- **Enrollment**: customerId, tier, currentBalance (projection).
- **Transaction**: amountFcfa, channel, occurredAt, location (optional), items (post-MVP).
- **Derived**: dayOfWeek, hour, nthVisit, etc. (computed deterministically from stored facts).

### Action outputs (events, not mutations)
Rule actions produce **event intents**:
- `PointsEarned(delta, ruleVersionId, transactionId)`
- `PointsBurned(delta, rewardId, redemptionId)`
- `TierChanged(from,to)` (optional MVP)
- `NotificationRequested(type,payload)` (async)

This keeps the ledger the single source of truth.

## Idempotency strategy (must-have)

### Cashier earn flow
Use an **idempotency key** per transaction creation (client-generated UUID) and enforce:
- `(tenantId, transactionId)` unique
- point events reference `transactionId`
- evaluator checks “already processed?” before emitting new events

### Redemption validate flow
Use claim code id (or redemptionId) as idempotency key:
- same claim validated twice returns the same result without double-burning.

## Explainability (“why did I get 140 points?”)

Store enough metadata to reconstruct explanations:
- `ruleVersionId` on each PointEvent
- optional “explanation snapshot”:
  - rule name + version
  - points calculation breakdown
  - passed conditions list

MVP: return explanation in API response; persist minimal references (ruleVersionId) + rebuild explanation by re-evaluating rule version on the stored context when needed.

## Performance considerations (low-cost infra)

- **Hot path**: earning points must be \(< 200-400ms\) typical.
- **Rule loading**: cache active rule versions per tenant (in-memory with TTL).
- **Projection writes**: keep projection updates simple (single-row update per enrollment).
- **Projection reads**: PWA reads balance from projection, not by replaying events.

## Fraud / abuse controls (early, MVP-friendly)

- **Rate limits**: per staff user and per enrollment (anti-spam).
- **Anomaly signals**:
  - unusually high points per day
  - repeated transactions with same amount at short intervals
- **Audit log**: all rule changes + redemptions + manual adjustments.

