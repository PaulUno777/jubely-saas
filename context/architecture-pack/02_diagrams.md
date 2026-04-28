# Jubely — conceptual architecture diagrams

## 1) Product / actor map

```mermaid
flowchart LR
  Customer[Customer_PWA_User] --> PWA[PWA_Client]
  Staff[Staff_Cashier] --> Agent[App_Agent_Cashier]
  Manager[Merchant_Manager] --> Dash[Dashboard_Manager_Admin]
  SuperAdmin[Platform_SuperAdmin] --> Portal[Portal_Super_Admin]

  PWA --> Core[Jubely_Core_Platform]
  Agent --> Core
  Dash --> Core
  Portal --> Core
```

## 2) C4 Level 1 — System context

```mermaid
flowchart TB
  subgraph Users[Users]
    EndUsers[Customers]
    StaffUsers[Merchant_Staff]
    AdminUsers[Merchant_Admins]
    SAUsers[Platform_SuperAdmins]
  end

  Jubely[Jubely_Platform]

  subgraph External[External_Systems]
    SMS[SMS_Provider]
    Push[PWA_Push_Service]
    Pay[Mobile_Money_Payments]
    POS[POS_Integrations_optional]
  end

  EndUsers --> Jubely
  StaffUsers --> Jubely
  AdminUsers --> Jubely
  SAUsers --> Jubely

  Jubely --> SMS
  Jubely --> Push
  Jubely --> Pay
  POS --> Jubely
```

## 3) C4 Level 2 — Container diagram (conceptual)

```mermaid
flowchart TB
  subgraph Clients[Clients]
    PWA[PWA_Client_Nextjs]
    Agent[App_Agent_PWA]
    Dash[Dashboard_Manager_Web]
    SA[Portal_SuperAdmin_Web]
  end

  subgraph Edge[Edge_CDN]
    CDN[Vercel_Edge_Network]
    EdgeFn[Vercel_Edge_Functions]
  end

  subgraph Backend[Backend_Runtime]
    APIGW[API_Gateway]
    Auth[Auth_RBAC_TenantRouting]
    Rules[Rules_Service_Authoring]
    Points[Points_Ledger_RuleRuntime]
    Rewards[Rewards_Redemption]
    Notify[Notifications_Worker_Async]
  end

  subgraph Data[Data_Stores]
    PG[(PostgreSQL_Supabase_Neon)]
    Redis[(Redis_Queue_optional)]
    Obj[(Object_Storage_optional)]
  end

  PWA --> CDN --> APIGW
  Agent --> CDN --> APIGW
  Dash --> EdgeFn --> APIGW
  SA --> EdgeFn --> APIGW

  APIGW --> Auth --> PG
  APIGW --> Rules --> PG
  APIGW --> Points --> PG
  APIGW --> Rewards --> PG
  Notify --> Redis
  Notify --> Obj
```

## 4) Domain model (conceptual)

```mermaid
classDiagram
  class Tenant {
    +UUID id
    +string name
    +string slug
    +PlanType plan
    +bool active
  }

  class User {
    +UUID id
    +UUID tenantId
    +string email
    +Role role
    +Permission[] permissions
  }

  class Customer {
    +UUID id
    +UUID tenantId
    +string phone
    +string name
  }

  class Enrollment {
    +UUID id
    +UUID tenantId
    +UUID customerId
    +Tier tier
    +int balancePoints_derived
  }

  class Transaction {
    +UUID id
    +UUID tenantId
    +UUID enrollmentId
    +int amountFcfa
    +string channel
    +datetime occurredAt
  }

  class RuleVersion {
    +UUID id
    +UUID tenantId
    +int version
    +bool active
    +int priority
    +Trigger trigger
    +RuleAst definition
  }

  class Reward {
    +UUID id
    +UUID tenantId
    +string name
    +int pointsCost
    +bool active
  }

  class Redemption {
    +UUID id
    +UUID tenantId
    +UUID rewardId
    +UUID enrollmentId
    +int pointsBurned
    +datetime claimedAt
  }

  class PointEvent {
    +UUID id
    +UUID tenantId
    +UUID enrollmentId
    +EventType type
    +int delta
    +UUID ruleVersionId
    +UUID transactionId
    +datetime createdAt
  }

  Tenant "1" --> "0..*" User
  Tenant "1" --> "0..*" Customer
  Customer "1" --> "0..*" Enrollment
  Enrollment "1" --> "0..*" Transaction
  Tenant "1" --> "0..*" RuleVersion
  Tenant "1" --> "0..*" Reward
  Enrollment "1" --> "0..*" Redemption
  Enrollment "1" --> "0..*" PointEvent
  RuleVersion "1" --> "0..*" PointEvent
  Transaction "1" --> "0..*" PointEvent
```

## 5) Core flows (sequence diagrams)

### 5.1 Earn points (cashier flow)

```mermaid
sequenceDiagram
  participant Cashier as App_Agent
  participant API as API_Gateway
  participant Auth as Auth_RBAC
  participant Rules as Rules_Runtime
  participant Ledger as Points_Ledger
  participant PG as PostgreSQL

  Cashier->>API: POST /transactions (customerQR,amount,channel)
  API->>Auth: verifyJWT + resolveTenant + permissions
  Auth-->>API: ok
  API->>PG: LoadEnrollment(customerId,tenantId)
  API->>Rules: EvaluateActiveRules(ctx)
  Rules->>PG: LoadActiveRuleVersions(trigger=TransactionRecorded)
  Rules->>Rules: Evaluate conditions + actions (deterministic)
  Rules-->>API: ActionsResult(pointsDelta,explanations,eventsToEmit)
  API->>Ledger: AppendPointEvents(eventsToEmit)
  Ledger->>PG: INSERT PointEvents (append-only)
  Ledger->>PG: UPDATE projections (balance,tier)
  Ledger-->>API: newBalance + derived tier
  API-->>Cashier: 200 OK (pointsIssued,newBalance,why)
```

### 5.2 Redeem reward (simple MVP)

```mermaid
sequenceDiagram
  participant Customer as PWA_Client
  participant API as API_Gateway
  participant Rewards as Rewards_Redemption
  participant Ledger as Points_Ledger
  participant Staff as App_Agent
  participant PG as PostgreSQL

  Customer->>API: POST /rewards/{id}/claim
  API->>Rewards: CreateClaim(enrollmentId,rewardId)
  Rewards->>PG: CheckEligibility(balance>=cost, reward active)
  Rewards-->>API: claimCode_QR (short-lived, signed)

  Staff->>API: POST /redemptions/validate (claimCode)
  API->>Rewards: ValidateClaim(claimCode)
  Rewards->>PG: Ensure single-use (idempotency key)
  Rewards->>Ledger: BurnPoints(enrollmentId,cost)
  Ledger->>PG: INSERT PointEvents(type=Burn)
  Ledger->>PG: UPDATE projections (balance)
  Rewards->>PG: INSERT Redemption
  API-->>Staff: 200 OK (burned,newBalance)
```

### 5.3 Rules lifecycle (draft → simulate → publish)

```mermaid
sequenceDiagram
  participant SA as Portal_SuperAdmin
  participant API as API_Gateway
  participant Rules as Rules_Service_Authoring
  participant Sim as Rules_Simulator
  participant PG as PostgreSQL

  SA->>API: POST /tenants/{t}/rules/drafts (ruleJSON)
  API->>Rules: Validate(ruleJSON)
  Rules->>Rules: Schema + types + determinism checks
  Rules->>PG: SaveDraft(ruleJSON)
  PG-->>Rules: draftId
  Rules-->>API: draftId

  SA->>API: POST /tenants/{t}/rules/drafts/{id}/simulate (testCase)
  API->>Sim: RunSimulation(draft,testCase)
  Sim->>Sim: Evaluate(rule,context) read-only
  Sim-->>API: result(points,why,conditionTrace)

  SA->>API: POST /tenants/{t}/rules/drafts/{id}/publish
  API->>Rules: PublishDraft(draftId)
  Rules->>PG: CreateRuleVersion(immutable,version++)
  Rules->>PG: ActivateRuleVersion(optional)
  API-->>SA: 200 OK (ruleVersionId)
```

## 6) Rules engine pipeline (runtime)

```mermaid
flowchart TB
  Tx[TransactionRecorded_Event] --> Ctx[Build_EvaluationContext]
  Ctx --> Load[Load_ActiveRuleVersions]
  Load --> Sort[Sort_ByPriority]
  Sort --> Eval[Evaluate_Conditions]
  Eval --> Decide{All_Conditions_True?}
  Decide -- No --> Next[Next_Rule]
  Decide -- Yes --> Acts[Execute_Actions_Deterministic]
  Acts --> Events[Emit_PointEvents]
  Events --> Ledger[Append_To_EventStore]
  Ledger --> Proj[Update_Projections]
  Acts --> SideFx[Enqueue_SideEffects_optional]
```

## 7) Event sourcing + projections (data architecture)

```mermaid
flowchart LR
  subgraph Store[AppendOnly_EventStore]
    E[point_events]
  end

  subgraph Projections[Materialized_Views_Tables]
    Bal[customer_points_balance]
    Tier[customer_tier_state]
    Stats[rule_stats_30d]
  end

  E --> Bal
  E --> Tier
  E --> Stats
```

## 8) Deployment / trust boundaries (refined from your sketch)

```mermaid
flowchart TB
  subgraph Public[Public_Internet]
    Clients[Clients_Devices]
  end

  subgraph Edge[Edge_CDN_Layer]
    VercelCDN[Vercel_Edge_Network]
    VercelFn[Vercel_Edge_Functions_auth_rate_limit]
  end

  subgraph Private[Backend_Network]
    APIGW[API_Gateway]
    Services[Core_Services_Auth_Points_Rules_Rewards]
    Worker[Async_Worker_Notifications]
  end

  subgraph Data[Data_Layer]
    PG[(PostgreSQL)]
    Queue[(Redis_Queue_optional)]
    Obj[(Object_Storage_optional)]
  end

  Clients --> VercelCDN --> VercelFn --> APIGW --> Services --> PG
  Worker --> Queue
  Worker --> Obj
```

## 9) Observability + audit (conceptual)

```mermaid
flowchart TB
  Apps[Clients_and_Services] --> Logs[Structured_Logs]
  Apps --> Metrics[Metrics]
  Apps --> Traces[Traces_optional]

  AdminActions[Admin_Actions] --> Audit[Audit_Log_Table]
  Redemptions[Redemptions] --> Audit
  RuleChanges[Rule_Publish_Activate] --> Audit

  Logs --> Alerting[Alerts]
  Metrics --> Alerting
  Audit --> Alerting
```

