# Handoff — context needed to build the Nucleus ERP UI on the Fountainhead Design System

**Paste this whole file as your opening message to the session that has the Nucleus specs + codebase.**

You (the receiving session) have the Nucleus specs and repo. A separate session owns
the **Fountainhead Design System** and will build the Nucleus UI screens on top of it —
but it needs the context below. Please gather it and reply with it (paste code/schema
verbatim, summarise prose). If you'd rather build the screens yourself, everything you
need to *consume* the design system is in section A.

---

## A. The design system (what Nucleus must be built on)

- **Repo:** `github.com/vardan-kabra/fountainhead-design-system` (private) · tag **`v1.3.0`**
- **What it is:** brand-accurate, framework-agnostic design tokens + CSS components,
  built from *Fountainhead Brand Guidelines 2025*. Ships a **Tailwind preset** and a
  **Next.js integration kit** made for exactly this stack (Next 15, React 19, Tailwind 3.4, TS).
- **Hard rule:** Nucleus UI uses **only** design-system tokens/components — no ad-hoc
  hex colours or magic spacing. A stray `#3b82f6` is a bug.

**Consume it (summary — full guide in `INTEGRATION.md` of that repo):**
```bash
npm i github:vardan-kabra/fountainhead-design-system#v1.3.0
```
```ts
// tailwind.config.ts
presets: [require("@fountainhead/design-system/tailwind-preset")]
```
```tsx
// app/layout.tsx — order matters: Tailwind first, DS on top
import "./globals.css";
import "@fountainhead/design-system/css/fountainhead.css";
// <html data-theme="light" data-density="comfortable" className={montserrat.variable + " " + nunito.variable}>
```
- Fonts: Montserrat (headings) + Nunito (body) via `next/font` → CSS vars
  `--font-montserrat` / `--font-nunito`. **Nucleus is an app surface, so also load
  Plus Jakarta Sans** — the product profile uses it.
- **Theming is automatic** via `data-theme` (`light`/`dark`) and `data-density`
  (`comfortable`/`compact`, for dense screens) on `<html>`.
- **Use the product profile (`data-profile="product"`):** Nucleus is an app/ERP surface,
  so set this on `<html>` for the intended look — the **"Beacon" identity** (deep-navy
  app-shell sidebar, left-accent KPI cards, tinted table header, bolder controls, Plus
  Jakarta Sans). Composes with theme + density. Added in **v1.3.0**.
- **Usage split:** Tailwind utilities on brand tokens for layout
  (`bg-surface text-foreground border-border rounded-lg p-6 shadow-fh-md`,
  `bg-primary text-primary-foreground`); ready-made `.fh-*` classes for components
  (`fh-btn fh-btn--primary`, `fh-table fh-table--striped`, `fh-card`, `fh-stat`,
  `fh-badge fh-badge--success`, `fh-input`, `fh-sidebar`, `fh-appshell`).
- A working reference dashboard + React starter (app shell, route-group layout,
  dashboard page) live in `examples/nextjs/` and `docs/examples/erp-dashboard.html`.

---

## B. What the design-system session needs back from you

### 1. Product / spec context
- The **foundations/spec doc** (the "decision C1" one) — or a summary: what Nucleus is,
  modules **in scope for v1**, and what's explicitly out of scope.
- **Confirm or correct the page inventory** in section C, and say **which modules ship first**.
- **Roles & permissions matrix** — which roles exist (admin / principal / teacher /
  accountant / transport-incharge / parent …?) and what each can see/do. The nav and
  page gating depend on this.
- **Key business rules that shape the UI** — fee cycles & statuses, attendance flow,
  admission stages, transport capacity rules, academic year/term model.

### 2. Data model (most valuable item)
- Paste **`prisma/schema.prisma`** verbatim. It determines list columns, detail fields,
  forms, and relations for every screen.
- All **enums** (statuses, types) and the **human labels** to show for each value.
- Shape of **seed/sample data** so screens render realistic content.

### 3. Codebase facts
- **Repo path / how to open it**; confirm versions (Next / React / Tailwind / Prisma /
  TS) and folder conventions (App Router layout, where `components/` live, path aliases).
- **Auth wiring** — the Cloudflare Access → JWT → email → role flow: paste the
  server-side helper/util that returns the **current user + role** in a server component,
  plus the `DEV_USER_EMAIL` bypass.
- **Existing UI/styling** — is there any current styling to migrate/replace? Is there a
  `tailwind.config` already? Any component library currently in use?
- **The pure-TS routing engine's public API** (exported function signatures + the
  `DistanceProvider` interface) — needed for the Transport / map screens.
- **Data-access pattern** — server actions, route handlers, or direct Prisma in RSCs?

### 4. Constraints
- **Localization** — English only, or Gujarati/Hindi too? **Currency/date** formats
  (assume ₹ / `en-IN`?). RTL needed?
- **Print** needs — fee receipts, ID cards, report cards?
- Any **deadlines / priority screens**.

---

## C. Page inventory (confirm / correct this)

| Module | Screens |
|---|---|
| Overview | Dashboard (reference already built) · Notifications |
| Auth/System | Login (Cloudflare Access) · Profile · Settings (school, academic year/terms, roles & permissions, branding) · Audit log |
| Students | List · Profile/detail · Add/Edit · Bulk import · ID cards (print) |
| Fees | Fee structure · Invoices · Collect payment · Receipt (print) · Defaulters · Reports |
| Transport | Route list · Route planner (map) · Stops · Vehicles/Drivers · Capacity |
| Attendance | Mark (daily) · Reports |
| Admissions | Enquiry → Application → Review → Offer → Enrolment |
| Staff | Directory · Profile · Roles |
| Comms | Announcements · Circulars |

**Suggested build order:** Login → App shell (done) → Dashboard (done) → **Students**
(list + detail + form — sets the CRUD pattern) → **Fees** (forms + receipts + print) →
**Transport** (wire the existing TS engine into the map screen) → Attendance → Settings.

---

## D. How to reply

One message (or a markdown file) covering B.1–B.4: paste the Prisma schema and the
auth-util verbatim, summarise the spec doc, fill the roles matrix, and set module
priority. With that, the design-system session can produce correct, data-wired Nucleus
screens that are on-brand by construction.
