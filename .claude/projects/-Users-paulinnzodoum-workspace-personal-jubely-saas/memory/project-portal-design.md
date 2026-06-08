---
name: portal-design-system
description: Design system details for agent (staff) and customer PWA portals — tokens, CSS scoping, component locations
metadata:
  type: project
---

Both portals share the Jubelee brand but use distinct color themes so users with multiple roles can instantly identify which portal they are in.

**Agent portal** — `data-portal="agent"`, `apps/web/src/app/agent/agent.css`
- Amber-cream background `#f6f4ef`, charcoal card `#29261b`, gold accent `#d4ae6c`
- CSS vars prefixed `--a-*`
- 5-tab nav: Home | Clients | [Scanner FAB dark] | Activity | Profile
- Tab bar hidden on: `/agent/scanner`, `/agent/customers/new`

**Customer portal** — `data-portal="customer"`, `apps/web/src/app/customer/customer.css`
- Sage-cream background `#f2f5f3`, forest-dark card `#1d2b22`, green accent `#2a6b46`
- CSS vars prefixed `--c-*`
- 5-tab nav: Wallet | Rewards | [QR FAB forest-dark] | Stores | Profile
- Tab bar hidden on: `/customer/scan`, `/customer/enroll`, `/customer/join`, `/customer/qr`
- `/customer` root → redirects to `/customer/wallet`

**Shared brand constants (loyalty card only):** gold `#d4ae6c` / `#b8924a` used across both portals — do not replace with portal-specific accent.

**JubelyLogo** (`@jubely/ui`) used everywhere instead of any custom LogoMark SVG.

**Why:** Different accent hues give instant visual identity without breaking Jubelee brand coherence.
