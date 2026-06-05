# Pull request: `feat/phase3-agent-purchase` → `develop`

**Stacked on:** `feat/auth-bff-httpOnly-pr1` (merge auth PR first, or retarget base).

## Title

```
feat(web): agent purchase flow and Phase 3 validation checklist
```

## Summary

- `/agent/purchase` — record purchase by phone + amount (FCFA), calls `POST /v1/staff/purchases`.
- Staff sidebar + agent home links; en/fr i18n.
- Schemas: `recordPurchase*` in `@jubely/api-schemas`, `staffRecordPurchase` in `staffApi`.

## Test plan

- [ ] Staff login → `/agent/purchase` → 4500 FCFA → +9 points for enrolled phone
- [ ] [phase3-validation.md](./phase3-validation.md) flows A–D
- [ ] Merchant `/store` metrics update after purchase
