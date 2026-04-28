# Domain glossary (normalized) + MVP flows

## Normalized terms (canonical vocabulary)

- **Tenant**: a merchant organization (an “enseigne” in your UI), owning customers, rules, rewards, staff users, and data.
- **User**: a human operator authenticated into Jubely.
  - **SuperAdmin**: platform operator across tenants (portal super-admin).
  - **MerchantAdmin/Manager**: tenant admin (dashboard).
  - **Staff/Cashier/Agent**: points operator (app agent / caisse).
- **Customer**: end user enrolled into a tenant’s loyalty program; has identifiers (phone, email) and a **CustomerQR** used by staff.
- **Enrollment**: the relationship “Customer is enrolled in Tenant loyalty program”, with tier state and point balance (derived).
- **Transaction**: a purchase-like event captured by staff (amount, channel, time, optional metadata). Transactions are *inputs* to rules evaluation.
- **Rule**: a tenant-scoped definition evaluated on events (MVP: transaction). A rule is expressed as:
  - **Trigger**: what event type activates it (e.g., TransactionRecorded).
  - **Conditions**: predicates on the evaluation context (amount, day-of-week, tier, channel, etc.).
  - **Actions**: deterministic outputs (e.g., compute points delta, multiply points, award fixed bonus, unlock reward, enqueue notification).
- **Reward**: a redeemable benefit offered by a tenant, defined by required points and reward details.
- **Redemption**: a customer claiming a reward; validates eligibility, burns a claim code, and emits points burn events.
- **PointEvent**: immutable ledger record used for event sourcing of points (earn/burn/adjust/recalc markers).

## Bounded contexts (conceptual modules)

- **Identity & Access**: authentication (JWT), tenant routing, RBAC/permissions, audit of admin actions.
- **Loyalty Ledger (Points)**: append-only event store + deterministic projections (balances, tiers).
- **Rules Authoring & Runtime**: rule modeling, validation, simulation, versioning, and evaluation pipeline.
- **Rewards & Redemption**: reward catalog + claim/validate flows; burns points through ledger.
- **Notifications (optional MVP)**: async side effects (SMS/push) triggered by rules or lifecycle events.
- **Billing/Plans (post-MVP)**: Pro/Premium enforcement (limits, quotas, feature flags).

## Core flows (MVP-first)

### 1) Enrollment (customer creation + QR)
**Goal**: create a customer and obtain a stable identifier to credit points.
- Staff creates customer (name/phone/email) OR customer self-signups (PWA).
- System generates **CustomerQR** (encoded customerId + tenantId, signed).
- Enrollment exists (customerId, tenantId) and starts with initial tier (e.g., Bronze).

### 2) Earn points (transaction → rules → ledger → balance)
**Goal**: cashier credits points immediately with auditable ledger.
- Staff scans CustomerQR (or searches phone) and enters **amount** (+ channel/time).
- Backend builds **EvaluationContext** (tenant + customer + transaction + current tier/balance).
- Active rules are evaluated deterministically.
- Resulting actions emit **PointEvents (earn)** and update projections (balance, tier).
- Cashier UI receives: points issued, new balance, applied rule explanation.

### 3) Redeem reward (simple MVP)
**Goal**: allow a customer to claim a single reward and burn points safely.
- Customer opens PWA and requests “claim reward” (if eligible).
- Backend issues a **RedemptionClaim** (short-lived QR/code, signed, single-use).
- Staff scans claim code and validates redemption.
- Backend emits **PointEvents (burn)** and records **Redemption** (idempotent).
- Customer balance updates; claim code becomes invalid (“cramé”).

### 4) Rule lifecycle (draft → validate → simulate → publish)
**Goal**: allow super-admin (and later tenant admins) to safely manage rules without corrupting points.
- Authoring produces canonical **RuleDefinition** (JSON/AST).
- Validation checks: schema, allowed operators, type checks, determinism constraints, and resource limits.
- Simulation executes rule(s) on **synthetic** or **sampled** historical contexts (read-only).
- Publishing creates an immutable **RuleVersion**; activation controls effective date and priority.
- Runtime uses *published active versions only*.

## What is “hard” (and why it’s the core)

### Points correctness
- Points must be **auditable** and **recomputable** as rules change.
- Correctness requires deterministic evaluation, strong idempotency, and clear boundaries between “ledger” and “projections”.

### Rule complexity growth path
- MVP can support a single simple earn rule (e.g., \(1\) point per \(X\) FCFA).
- Pro/Premium introduces combinatorial rule sets (multiple conditions, priorities, overlaps).
- Without rule versioning + simulation + ledger, rule changes become a data integrity risk.

