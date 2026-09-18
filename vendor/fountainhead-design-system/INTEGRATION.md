# Integrating Fountainhead DS into Nucleus (Next.js 15 · React 19 · Tailwind 3.4 · TS)

This guide wires the design system into your existing app. Copy-paste files live in
[`examples/nextjs/`](examples/nextjs). The mental model:

> **Brand ramps** (`fh-blue-600`) are static hex → full Tailwind features.
> **Semantic colours** (`bg-primary`, `text-foreground`, `border-border`) resolve to
> CSS variables → they flip automatically with `data-theme` and `data-density`.
> **`.fh-*` component classes** (buttons, inputs, tables…) are ready-made and respond
> to density. Use Tailwind utilities for layout & one-offs; use `.fh-*` for standard
> components.

---

## 1. Get the DS into the app

**Recommended — install straight from the private repo (git dependency):**

```bash
npm i github:vardan-kabra/fountainhead-design-system#v1.3.0
```

It installs under its package name, so imports like
`@fountainhead/design-system/css/fountainhead.css` resolve. Pin to a tag (`#v1.3.0`)
and bump when the DS releases. (Whoever installs needs read access to the private repo
— their normal git/GitHub auth covers it.)

<details><summary>Alternatives</summary>

- **Git submodule** + local install: `git submodule add … design-system && npm i ./design-system`
- **GitHub Packages registry**: rename the package scope to match the repo owner
  (`@vardan-kabra/…`), add `publishConfig.registry`, and configure `.npmrc`.
- **Copy** `css/`, `tailwind/`, `tokens/` into the app (simplest, but you lose update-by-version).
</details>

## 2. Fonts (next/font)

Copy [`examples/nextjs/app/fonts.ts`](examples/nextjs/app/fonts.ts). It self-hosts
Montserrat + Nunito and exposes `--font-montserrat` / `--font-nunito`, which the
Tailwind preset's `font-heading` / `font-body` reference. No CDN, no layout shift.

> **Product/ERP surfaces** (`data-profile="product"`) use **Plus Jakarta Sans** for
> headings + body — load it too (add it to `fonts.ts` and the `<html>` font vars).
> See [`assets/fonts.md`](assets/fonts.md).

## 3. Tailwind config

```ts
// tailwind.config.ts
import fountainhead from "@fountainhead/design-system/tailwind-preset";
export default {
  presets: [fountainhead],                         // colours, fonts, radii, shadows, type scale
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}",
            "./node_modules/@fountainhead/design-system/css/**/*.css"],
} satisfies Config;
```

`darkMode: ['class', '[data-theme="dark"]']` comes from the preset — so `dark:`
variants work, though most theming is automatic via the CSS-var colours.

## 4. globals.css + layout import order (important)

`app/globals.css` holds only the Tailwind directives. Import the DS in
`app/layout.tsx` **after** `globals.css` so brand element/typography defaults sit on
top of Tailwind's preflight:

```tsx
import "./globals.css";                                       // 1) Tailwind (preflight)
import "@fountainhead/design-system/css/fountainhead.css";    // 2) DS on top
```

Tailwind utility classes still win by specificity (class > element), so
`<h1 className="text-2xl">` overrides the brand H1 size fine.

> Pure-Tailwind shop that doesn't want our reset/typography? Import only
> `css/tokens.css` (the variables — required) and optionally `css/components.css`.

Then set the theme on `<html>` (see [`examples/nextjs/app/layout.tsx`](examples/nextjs/app/layout.tsx)):

```tsx
<html data-theme="light" data-density="comfortable"
      className={`${montserrat.variable} ${nunito.variable}`}>
```

## 5. Theme + density switching

Drop in [`examples/nextjs/components/theme-toggle.tsx`](examples/nextjs/components/theme-toggle.tsx).
It sets `data-theme` / `data-density` on `<html>` and persists to `localStorage`.

**No-flash on first paint** (recommended for SSR): store the choice in a cookie, read
it in the server layout to set the initial `data-theme`, or inline a tiny script in
`<head>` that applies `localStorage` before hydration.

## 6. Usage — when to use what

```tsx
// Standard components → .fh-* classes (they respect density automatically)
<button className="fh-btn fh-btn--primary">Save</button>
<span className="fh-badge fh-badge--success">Paid</span>
<table className="fh-table fh-table--striped fh-table--hover"> … </table>

// Layout & one-offs → Tailwind utilities on brand tokens
<div className="bg-surface text-foreground border border-border rounded-lg p-6 shadow-fh-md">
  <h2 className="font-heading text-3xl font-bold text-foreground">Dashboard</h2>
  <p className="text-muted">Term 1 overview</p>
  <a className="text-primary hover:underline">View all</a>
</div>
```

**Density caveat:** `.fh-*` components react to `data-density`. A control you build
purely from utilities won't — size it from the control tokens if it should, e.g.
`className="h-[var(--fh-control-height)] px-[var(--fh-control-pad-x)]"`, or just use
the `.fh-*` class.

## 7. ERP specifics

- **Turn on the product profile (the "Beacon" identity):** set `data-profile="product"`
  on `<html>` for app/ERP surfaces. This applies the deep-navy app-shell sidebar (yellow
  active bar), left-accent KPI cards (`.fh-stat--*` sets the colour), brand-ticked card
  titles, a tinted table header, bolder controls, and switches the UI face to **Plus
  Jakarta Sans** with softer heading weights. It composes with `data-theme`/`data-density`.
  Marketing surfaces leave it off and keep Montserrat + Nunito. For the sidebar logo,
  include both `.fh-logo--on-light` and `.fh-logo--on-dark` images — the profile shows
  the white one on the navy rail.
- **Data tables:** pair **TanStack Table** (headless logic) with `.fh-table` +
  `data-density="compact"` for dense screens. Add sort/filter/row-select/paginate.
- **Forms:** **React Hook Form + Zod**, rendered with `.fh-field / .fh-input /
  .fh-error` and the `.is-invalid` state.
- **Interactive overlays** (modal, dropdown, combobox, toast): use a headless lib
  (**Radix / Ark / Headless UI**) for accessibility, styled with brand tokens —
  the DS gives the look, the headless lib gives the behavior.
- **Charts & maps:** import the brand palette from the typed tokens:
  ```ts
  import { fhChartCategorical, fhColor } from "@fountainhead/design-system/tokens.ts";
  // Leaflet route colours, Recharts series, etc.
  ```
  Importing raw `.ts` from a dependency: add `transpilePackages:
  ["@fountainhead/design-system"]` to `next.config.ts` (or just copy the few values
  you need).
- **Money/dates:** centralise `new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR" })`
  and a date helper so every screen formats ₹ / dates identically.

## 7b. Screen archetypes (compose, don't design)

Reference implementations live under `docs/examples/` — copy the structure, swap the data:

- **List page** — the canonical recipe (live consumer: the Nucleus Directory):
  `.fh-toolbar` (search `.fh-input` + auto-sized `.fh-select`s + result count in
  `.fh-toolbar__spacer`) → `.fh-table--striped --hover` (add `.fh-table__check` +
  `tr.is-selected` + a `.fh-bulkbar` above the table for bulk actions) →
  `.fh-pagination` + "Showing x–y of n" → scope/authorization footnote →
  `.fh-empty-state` for the filtered-no-results moment.
- **Form page** — [`erp-archetypes.html?page=form`](docs/examples/erp-archetypes.html):
  sectioned `.fh-card`s of `.fh-field`s in a 2-col grid; validation via `.is-invalid` +
  `.fh-error`; action footer in `.fh-card__footer` (autosave meta left; Cancel · Save
  draft · primary action right).
- **Detail page** — `erp-archetypes.html?page=detail`: `.fh-person` identity header
  (avatar-lg + name + meta) with status badge + actions, `.fh-tabs`, key-value profile
  card + guardians as `.fh-person` rows + side stat cards.
- **Wizard** — `erp-archetypes.html?page=wizard`: `.fh-stepper` in a card, one step's
  body at a time, footer with step meta + Back/Continue.
- **Grade grid** — `erp-archetypes.html?page=grid`: `.fh-table--frozen-first` (sticky
  student column) + `.fh-table__center` + `.fh-grade--1…7` chips (1 is red-tinted;
  `--na` = not assessed) + the term switcher (`.fh-btn-group` + `.fh-btn.is-active`).
- **Org tree / node picker** — `erp-archetypes.html?page=org`: `.fh-tree` with
  `details.fh-tree__branch` branches (CSS-only expand/collapse) and composable rows
  (`__label` + `__meta` + badges + `.fh-person` for postings). The same tree inside a
  modal is the **org-node picker** for postings, role scopes, and leave-approval chains;
  mark the chosen row `.is-selected`.
- **Pipeline board** — `erp-archetypes.html?page=recruitment`: `.fh-board` columns
  (`__head` + count badge, `__cards`) of `.fh-board__card`s (usually `.fh-person` +
  badges). Drag-and-drop is consumer JS (dnd-kit etc.) — cards/columns expose
  `.is-dragging` / `.is-over`. Pair with `.fh-stepper` for the single-item journey and
  `.fh-timeline` for per-item activity history.
- **Face wall (v1.13)** — `erp-archetypes.html?page=faces`: `.fh-facegrid` of
  `__tile`s (`__photo` + `__name` + `__meta` + corner `__mark`). The photo is an `<img>`
  inside `__photo` (`loading="lazy"`, `alt=""` — the name is adjacent text); **no img =
  the initials fallback**, which is also the photo-consent-off state — treat it as
  first-class, never as an error. Attendance marking: tiles are `<button>`s cycling
  `--present/--absent/--late` (same tones as `.fh-mark`); rosters/pickers: tiles are
  `<a>`s, chosen row gets `.is-selected`. Print: the class photo-sheet
  (`erp-print.html?doc=classsheet`) reuses the same grid inside `.fh-sheet`.
- **Payroll (v1.12)** — `erp-archetypes.html?page=payroll`: KPI `.fh-stat` strip →
  **salary-structure table** (component + basis + `.fh-table__num` amount; type as small
  badges: earning `--primary`, deduction plain, benefit `--outline`; keep red strictly
  semantic) → **pay-run register** as `.fh-table--frozen-first` (`.fh-person` column frozen,
  wide money columns, status chips paid/queued/hold, `tbody.fh-u-tabular`) + month switcher
  (`.fh-btn-group` + `.is-active`). Pay-run approval is a maker-checker write — reuse the
  stepper + confirm patterns.
- **Form builder (FDC)** — `erp-archetypes.html?page=formbuilder`: palette → canvas →
  properties, all from existing primitives (cards, `.fh-field`s, badges, `.fh-check`).
  Checkpoint verdict (v1.12): **no new archetype CSS** — selected-field ring (2px primary
  border) and dashed insertion marker are recipe-only; reuse the board's `is-dragging`/
  `is-over` semantics for palette→canvas drags.
- **Lock states (v1.14)** — `erp-archetypes.html?page=lock`: one immutability language for
  HR month-end (StaffLock → HRLock, per campus) and payroll runs (draft → review → approve
  → lock → superseded). `.fh-lock` chip (`--open/--soft/--hard/--superseded`, BYO padlock
  svg in `__icon`); `.fh-lockbar` page banner (`__icon/__title/__meta/__checksum/__actions`;
  `--hard` renders Beacon navy under the product profile); `.fh-frozen` content veil
  (visual only — the consumer still disables controls); `.fh-lockmatrix` campus×month
  board (column count via `--fh-lockmatrix-cols`; cells are `<button>`s when they drill
  down, `<span>`s read-only; `.is-current` rings the month being closed; `--na` = future
  month). CSS is only the language — locks are enforced in the write plane.
- **Governed values (v1.15)** — `erp-archetypes.html?page=governed`: the where-does-this-
  number-come-from language for every config screen. `.fh-validity` effective-dated
  timeline (segments weighted by inline `flex:`; validTo EXCLUSIVE so segments butt;
  states `--expired/--current/--future/--superseded`, `--open-ended` = validTo null;
  as-of marker via `--fh-validity-asof:<percent>`; extra `__track` rows = correction
  lanes). `.fh-source` provenance chip — specificity reads as intensity: group outline ▸
  `--campus` tinted ▸ `--person` solid; `--fixed` (ink + padlock) = statutory floor no
  layer may cross; `is-winner` = the layer resolution picked. `.fh-bounds` = the allowed
  window under a Bounded input (`__fill` inset by inline left/right %; `__dot` at the
  value; `is-clamped` warns — clamped, never silently rejected). `.fh-resolve` = the
  master ▸ tweak ▸ deviation → resolved panel (`--skip` rows for absent layers,
  `__final` is the served value). Resolution itself is the consumer's service (POL-4) —
  these classes only *display* its answer.
- **Ledger (v1.16)** — `erp-archetypes.html?page=ledger`: the money-table idiom.
  `.fh-table--ledger` on any `.fh-table` (tabular numerals table-wide; `tfoot` = grand
  total with the accounting double-rule). Cells: `.fh-table__money` (right, nowrap),
  `.fh-table__balance` (the derived running-balance column, sunken), `.fh-table__groupstart`
  (fences a column group, e.g. the arrears trio). Rows: `.fh-table__row--subtotal`.
  Inline: `.fh-money` with a quiet `__cur` slot (`<span class="fh-money">
  <span class="fh-money__cur">₹</span>45,000</span>`); `--neg` dues / `--pos` wallet-credit
  tint the whole amount — numerals stay ink unless colour carries meaning. `.fh-drcr--dr/--cr`
  direction letters; `.fh-was` (struck old value) → recomputed → `.fh-delta--up/--down`
  (prefixes a real +/−) for arrears recomputes. Formatting (Indian grouping, symbol) is the
  consumer's formatter; inside `.fh-sheet` the same table prints crisp.
- **Capacity & masks (v1.16)** — `erp-archetypes.html?page=capacity`: `.fh-capacity` — the
  track is EVERYTHING (cap + overrun), the `__gate` marker (via `--fh-capacity-gate:<pct>`)
  shows the cap, so overrun renders beyond it: `--over` warning stripes (soft, flagged) or
  `--override` navy stripes (audited — someone answered for it). Segments weight by inline
  `flex:`; under-cap leaves a bare spacer `<div style="flex:n">`. `.fh-masked` = Tier-1
  audited reveal on native `<details>` — consumer logs the R3-4 reveal on `toggle`.
- **Review & worklist (v1.16)** — `erp-archetypes.html?page=review`: `.fh-diff`
  (head + rows; mark only changes with `is-changed`; `is-conflict` = reconciliation
  mismatch needing a human call); `.fh-pending` dashed veil + `__flag` on the originating
  record. `.fh-status--open/--progress/--paused/--resolved/--closed` (lifecycle) vs
  `--due/--overdue/--escalated` (due-state) — two axes, both can be true, never conflate.
  `.fh-worklist` bands (`--overdue` tints) + `__item` grid rows (`__type/__title/__meta`).
- **Commit grid (v1.16)** — `erp-archetypes.html?page=commitgrid`: `.fh-commitgrid` table,
  `<button class="fh-cgcell">` cells — `--suggested` (ghost italic, dotted: the system's
  proposal is never silently real), `--dirty` (accent corner: unsaved), `--committed`
  (ink + quiet check). `__calc` = live-recompute summary cells; editor popover, focus and
  arrow-key nav are consumer JS.
- **Assembled documents (v1.16)** — `erp-print.html?doc=handbook`: `.fh-doc` stacks
  `.fh-sheet`s (screen: gap; print: one page each). `.fh-doc__cover/__covertitle/__coversub/
  __coverstamp`, `.fh-doc__toc` with `__tocleader` dotted leaders, `.fh-doc__sectionhead`,
  `.fh-sheet__runfoot` + `.fh-sheet__pageno` (CSS counters — never hand-numbered). The
  handbook rule: the book is an assembled OUTPUT; governance and signatures stay on each
  policy (POL-12/13).
- **Print documents** — [`erp-print.html`](docs/examples/erp-print.html)
  (`?doc=receipt|report|idcard|offer|payslip`): `.fh-sheet` (+ `--a5 --card`) with `__head/__doc/__foot/__sign`;
  app chrome auto-hides under `@media print`; helpers `.fh-print-only`, `.fh-u-print-hidden`,
  `.fh-print-break`. The offer letter + payslip are the HRIS reference documents — the
  payslip shows the money conventions (masked identifiers, earnings/deductions pair,
  net-pay band with amount-in-words, YTD strip).
- **Moments:** empty/error → `.fh-empty-state`; async feedback → `.fh-toast` (+
  `.fh-toaster`); destructive confirm → `.fh-modal--confirm`. **React wiring for the
  CSS-only pieces ships in the kit:** [`components/toast.tsx`](examples/nextjs/components/toast.tsx)
  (`<ToastProvider>` + `useToast()`) and
  [`components/confirm-dialog.tsx`](examples/nextjs/components/confirm-dialog.tsx)
  (`<ConfirmDialog>`); [`components/app-shell.tsx`](examples/nextjs/components/app-shell.tsx)
  is the Beacon shell reference incl. the mobile drawer.
- **Money/dates:** format ₹ with `Intl.NumberFormat("en-IN", {style:"currency",
  currency:"INR"})`, right-align in `.fh-table__num` (tabular numerals are automatic).

**Icons:** the DS ships no icon set — use inline Lucide-style SVGs with
`stroke="currentColor"`, ~18px; they inherit text/nav colours (and the navy-rail white)
automatically. **Sidebar logo:** include both `<img class="fh-logo--on-light">` and
`<img class="fh-logo--on-dark">` in `.fh-sidebar__brand` — the product profile shows the
white mark on the navy rail.

## 7c. Interaction & accessibility notes (per pattern)

What the DS/kit handles vs. what the consumer must wire:

- **Confirm dialog** — kit's `ConfirmDialog`: `role="alertdialog"` + `aria-modal`,
  labelled by the title, focuses the primary action on open, Escape + overlay-click
  cancel. **Not included:** a full focus *trap* (Tab cycling) — add one (or render a
  headless Radix/Ark dialog styled with the `fh-modal` classes) for keyboard-heavy flows.
- **Toast** — kit's `ToastProvider`: container `role="region"
  aria-label="Notifications"`; errors `role="alert"`, the rest `role="status"`. Never
  put a *required* action only in a toast — it auto-dismisses.
- **Drawer** — give the hamburger an `aria-label`; scrim click closes (kit). Wire
  Escape-to-close and move focus into the rail on open for keyboard users — consumer
  responsibility today.
- **Stepper** — visual by default; add `aria-current="step"` on the active step and
  render as an `<ol>` when steps are navigable.
- **Marks** (`.fh-mark`) — real `<button>`s whose `aria-label` carries student + state
  ("Aanya Shah: present"); update the label when the state cycles.
- **Row selection** — the `.fh-check` checkbox is the accessible control;
  `tr.is-selected` is presentation. Don't make the row itself the only toggle.
- **Tooltip** — shows on hover *and* `:focus-within` (built-in) — so the trigger must
  be focusable.
- **Tree** — `details`/`summary` gives keyboard expand/collapse for free; if a screen
  needs full tree-widget semantics (arrow-key navigation), layer `role="tree"` +
  `aria-level`/`aria-expanded` or use a headless tree lib styled with the `fh-tree` classes.
  In picker use, reflect `.is-selected` with `aria-selected`.
- **Board** — pointer drag-and-drop **must** have a keyboard alternative: give each card
  a "Move to stage…" menu (fh-menu) or equivalent. `.is-dragging`/`.is-over` are visual
  hooks only.
- **Timeline** — render as an `<ol>` in true chronological order; the dots are decorative
  (`aria-hidden` not needed — they're CSS pseudo-elements).
- **Face grid** — marking tiles are `<button>`s: carry person + state in `aria-label`
  ("Aanya Shah: present") and update it as the state cycles (like `.fh-mark`); the corner
  glyph alone is not the announcement. Roster tiles are links; reflect `.is-selected`
  with `aria-current`/`aria-selected` in picker use. Photos: `alt=""` (name is adjacent),
  `loading="lazy"` on big walls; never load a photo where consent is off — omit the
  `<img>` and the initials fallback renders.
- **Focus rings** — never remove them; the DS keeps `:focus-visible` everywhere,
  including the yellow ring on the navy rail.

## 8. Governance (keep them in sync)

- The ERP should contain **no hard-coded colours/spacing** — only brand tokens
  (`bg-primary`, `var(--fh-*)`, `fh-blue-600`). A stray `#3b82f6` is a bug.
- Need a component the DS lacks? **Build it in this DS repo and release a new tag**,
  then bump the app's dependency — don't fork styles into the app.
- Brand value changes happen in `scripts/generate_tokens.py` (+ `css/tokens.css` /
  `_fountainhead.scss`); re-running the script regenerates `tokens.json`, the
  **Tailwind preset**, and **tokens.ts** together, so the app picks them up on upgrade.

## Quick checklist

- [ ] `npm i github:vardan-kabra/fountainhead-design-system#v1.3.0`
- [ ] add `fonts.ts`, set `--font-*` vars on `<html>`
- [ ] `presets: [fountainhead]` in `tailwind.config.ts`
- [ ] import order in `layout.tsx`: `globals.css` → `fountainhead.css`
- [ ] `data-theme` / `data-density` on `<html>` + ThemeToggle
- [ ] replace ad-hoc colours with brand tokens
