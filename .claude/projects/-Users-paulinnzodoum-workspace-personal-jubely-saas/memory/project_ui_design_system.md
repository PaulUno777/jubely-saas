---
name: Jubely UI design system conventions
description: Design system choices, component locations, and shadcn-admin template alignment for the monorepo
type: project
---

The shared UI lives in `packages/ui` — it's the source of truth for all components.

**Template inspiration:** https://github.com/PaulUno777/shadcn-admin (fork of satnaing/shadcn-admin). All admin layout patterns (Sidebar, Header, Main, NavGroup, NavUser) should follow that template.

**Color scheme — admin app (dark by default):**
- Background: `#0f0f0f`, Card: `#1c1c1c`, Sidebar: `#161616`
- Primary: `#3ecf8e` (teal green), Accent: `#f4a228` (amber)
- Sidebar accent (hover): `rgba(255,255,255,0.07)`

**Color scheme — agent + client-pwa (light):**
- Background: `#faf3e0` (warm cream), Primary: `#c1440e` (terra cotta)

**Why:** The admin is the superadmin portal (dark, serious) while agent/client-pwa are merchant-facing (warm, brand-aligned).

**Fonts:** `Instrument Serif` (display/headings), `DM Sans` (body), `DM Mono` (numbers/slugs). Google Fonts `@import` goes at the very top of each app's `globals.css` BEFORE `@import "tailwindcss"` — otherwise PostCSS errors.

**Sidebar CSS vars** must be mapped in each app's `@theme inline` block:
```css
--color-sidebar: var(--sidebar);
--color-sidebar-foreground: var(--sidebar-foreground);
/* ... etc */
```

**Admin app layout pattern:**
```
SidebarProvider > AppSidebar + SidebarInset > Header (sticky) + Main
```

**Login page pattern:** Centered, `max-w-sm` Card, JubelyLogo above, AuthStepNav below logo, card uses shadcn Card primitives (not custom AuthCard).

**How to apply:** Follow shadcn-admin component patterns when adding new admin pages. Use `@jubely/ui` imports, never copy-paste raw Radix primitives into the app.
