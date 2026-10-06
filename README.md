# SmartMenus — MVP

**Your restaurant's digital guest experience, built into every table.**

A multi-tenant SaaS platform that turns a physical NFC/QR table object into a
mobile guest experience: digital menu, allergens, dietary filters, a
restaurant-grounded AI concierge, service calls and feedback — plus a full
restaurant dashboard with CMS, table/object management and analytics.

Built to the *SmartMenus Project Brief* and *MVP Wireframes & User Flow*
specifications (Rediscover Studios).

---

## Quick start

```bash
cd ~/smartmenus
npm install
npm run setup     # prisma db push + generate + seed
npm run dev       # http://localhost:3000
```

### Demo logins — password `demo`

| Email | Role | Tenant |
|---|---|---|
| `leo.a@example.org` | super admin | platform |
| `grace.l@example.com` | owner | Côte Sauvage |
| `julien.m@example.com` | owner | Côte Sauvage |
| `xena.w@example.org` | staff | Côte Sauvage |
| `wendy.h@example.net` | owner | Harbour & Co. |
| `fiona.g@example.net` | owner | Atelier Cascavelle |

### Guest entry points (simulate an NFC tap / QR scan)

| URL | Restaurant |
|---|---|
| `/t/T8SAUV` | Côte Sauvage (fine dining, dark · FR-first) |
| `/t/T3HARB` | Harbour & Co. (grill, dark · EN) |
| `/t/T1ATEL` | Atelier Cascavelle (café, light theme) |

Add `?s=nfc` or `?s=qr` to record the acquisition source.

---

## Architecture

```
Next.js 14 (App Router, RSC)  ·  TypeScript  ·  Tailwind
        │
        ├── Guest experience  /t/[code]        ← NFC/QR entry
        ├── Restaurant dashboard /dashboard     ← CMS, floor, analytics
        ├── Platform admin /admin               ← tenants, subscriptions
        └── API routes /api/*                   ← resolve, ai, order, feedback…
        │
     Prisma ORM  →  SQLite (dev) / PostgreSQL (prod)
```

### Why these choices

- **Next.js App Router** — server components keep the guest menu fast and
  SEO-friendly; the dashboard uses server actions so there is no separate
  API layer to maintain.
- **Prisma** — one typed schema drives the whole multi-tenant data model.
  Switching to PostgreSQL for production is a two-line change (`provider` +
  `DATABASE_URL`).
- **SQLite in dev** — zero setup for the pilot; the schema is provider-agnostic.
- **No LLM dependency for the AI** — the assistant is a deterministic
  retrieval engine over structured restaurant data (see below). It works
  offline, costs nothing per query, and cannot hallucinate. A provider seam
  is left for plugging in a model later.

---

## Multi-tenancy & security

Every tenant-scoped table carries `restaurantId`. Isolation is enforced in
three layers:

1. **Session** — HMAC-signed, httpOnly cookies (`lib/auth.ts`).
2. **`requireTenant()`** — every server action resolves the caller's
   `restaurantId` and rejects cross-tenant access.
3. **Scoped queries** — dashboard reads always filter by the caller's tenant;
   updates re-check ownership before writing.

Verified by the smoke test: a Harbour owner can never see Côte Sauvage items,
staff cannot reach `/admin`, and restaurant owners cannot reach `/admin`.

Also implemented: bcrypt password hashing, input validation (Zod), opaque
public codes (no raw DB ids in URLs), AI rate limiting, audit logging, and
role-based navigation.

---

## The AI assistant (the differentiator)

Per the brief, this is **not** a general-purpose chatbot. `lib/ai.ts`
implements a deterministic engine that answers **only** from the restaurant's
structured data:

| Requirement | Implementation |
|---|---|
| Never invent ingredients/prices/promotions | Answers are assembled from DB rows only |
| Respect availability | Sold-out items are never recommended |
| Never guarantee allergen safety | Allergen answers carry a "confirm with staff" caveat |
| No medical claims | Dedicated guardrail branch |
| Distinguish popularity vs recommendation | Ranks by real `item_viewed` counts, labelled "based on the restaurant's data" |
| Unknown → escalate | Returns the exact "please ask a member of staff" copy + a Call Staff button |
| Provider-abstracted | `generateAnswer()` is the single seam for an LLM swap |

Test it directly:

```bash
npx tsx scripts/test-ai.ts     # 11 grounding/guardrail assertions
```

---

## Analytics

Guest interactions are recorded as `Interaction` rows (minimal, anonymous,
privacy-conscious). The dashboard derives: sessions, NFC-vs-QR split, menu
views, most-viewed dishes, most-searched terms, AI questions, table activity,
service requests, feedback and AI usage against the plan allowance.

The seed generates 30 days of realistic traffic so every screen has content
on first run.

---

## Project layout

```
src/
  app/
    page.tsx              marketing landing
    login/                dashboard login
    t/[code]/             GUEST EXPERIENCE (NFC/QR entry)
    dashboard/            restaurant dashboard (9 pages)
    admin/                platform admin
    api/                  resolve · ai/chat · order · feedback ·
                          service-request · track
    actions/              server actions (auth, menu, dashboard)
  components/
    guest/                guest UI (11 components)
    dash/                 dashboard UI
  lib/
    ai.ts                 grounded assistant engine
    auth.ts               sessions + tenant guard
    db.ts                 prisma client
    analytics.ts          event capture
    analytics-queries.ts  dashboard aggregations
    i18n.ts               EN/FR dictionary
prisma/
  schema.prisma           20+ models, multi-tenant
  seed.ts                 3 pilot tenants, real menus, 30d analytics
scripts/
  test-ai.ts              AI grounding tests
  smoke.ts                end-to-end tests (32 assertions)
```

---

## Verification status

```
npx tsc --noEmit     ✓ clean
npm run build        ✓ 21 routes
npx tsx scripts/test-ai.ts   ✓ 11/11
npx tsx scripts/smoke.ts     ✓ 32/32
```

The smoke test covers guest rendering for all three tenants, sold-out states,
bilingual toggle, authentication, all nine dashboard pages, **tenant
isolation**, role-based admin access, and every guest API including the AI
guardrails.

---

## Design system

One codebase renders three visually distinct restaurants. Each restaurant's
colours are applied at runtime as CSS variables (`--brand`, `--brand-2`,
`--surface`, `--ink`), so the fine-dining room is dark ink + brass, the grill
is charcoal + ember, and the café is cream + sage — with no per-tenant builds.

- **Typography** — Fraunces (display serif) + Inter (UI sans)
- **Motion** — restrained, `prefers-reduced-motion` respected
- **Accessibility** — semantic HTML, focus states, alt text, no colour-only
  status, thumb-friendly tap targets, safe-area padding

---

## Out of scope (per brief §50)

Native apps, POS integration, payment processing, loyalty, customer accounts,
reservations, KDS and inventory are deliberately excluded from the MVP. The
architecture leaves seams for each (integration layer, provider abstraction,
subscription model).
