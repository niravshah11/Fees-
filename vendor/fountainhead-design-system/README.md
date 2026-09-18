# Fountainhead Design System

A brand-accurate, **framework-agnostic** design system built straight from the
*Fountainhead Brand Guidelines 2025*. One source of truth for colour, type, and
UI components — drop it into the **website**, the **ERP apps**, or anything else
Fountainhead builds, on any stack (plain HTML, React, Vue, Angular, Laravel…).

It ships as plain CSS custom properties + a vanilla CSS component library, so
there's nothing to compile and no framework lock-in.

> **Brand:** Blue `#005BAA` · Red `#B8292F` · Yellow `#F2C418` · Montserrat + Nunito
> **Mission:** *To nurture leaders with character and competence.*

---

## Quick start

1. Load the fonts (see [`assets/fonts.md`](assets/fonts.md)) and the stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&family=Nunito:wght@400;600;700&display=swap">

<link rel="stylesheet" href="css/fountainhead.css">
```

2. Set the theme on `<html>` and start using classes:

```html
<html data-theme="light" data-density="comfortable">
  <body>
    <button class="fh-btn fh-btn--primary">Apply now</button>
    <span class="fh-badge fh-badge--success">Paid</span>
  </body>
</html>
```

3. Open [`docs/index.html`](docs/index.html) in a browser — the **living style
   guide** showing every token and component, with working theme/density toggles.

---

## What's inside

```
fountainhead-design-system/
├── css/
│   ├── fountainhead.css   ← single entry point (@imports the four below)
│   ├── tokens.css         ← all design tokens + light/dark/compact themes
│   ├── base.css           ← reset + element defaults + brand type baseline
│   ├── components.css      ← buttons, forms, tables, cards, nav, modal…
│   └── utilities.css      ← layout primitives + helper classes
├── tokens/
│   ├── tokens.json        ← W3C Design Tokens format (machine-readable source)
│   └── _fountainhead.scss ← SCSS variables, maps & breakpoint mixins
├── assets/
│   ├── logo/              ← logo + brandmark (colour, white, single-blue; PNG, transparent)
│   └── fonts.md           ← how to load Montserrat + Nunito
├── docs/index.html        ← living style guide / showcase
└── scripts/               ← Python tools to regenerate tokens & logo assets
```

You can link `css/fountainhead.css` for everything, or import individual layers.
**Load order matters:** tokens → base → components → utilities.

---

## Theming

Themes are pure CSS — set attributes on `<html>` (or any wrapper), no JS required.

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-theme` | `light` (default), `dark`, `auto` | Colour scheme. `auto` follows the OS setting. |
| `data-density` | `comfortable` (default), `compact` | `compact` tightens control heights, paddings & table rows — ideal for data-dense ERP screens. |
| `data-profile` | *(unset / brand)*, `product` | **Opt-in operational tuning for app/ERP surfaces (the "Beacon" identity):** standardises headings + body on Plus Jakarta Sans, applies the deep-navy app-shell sidebar / left-accent KPI cards / tinted table header / bolder controls, tightens secondary-text contrast, and turns on tabular numerals. Leave it off for marketing/print surfaces, which keep the expressive brand defaults (Montserrat + Nunito). |

```js
// toggle dark mode
document.documentElement.setAttribute('data-theme', 'dark');
// switch to dense ERP layout
document.documentElement.setAttribute('data-density', 'compact');
// opt the app surface into the operational profile
document.documentElement.setAttribute('data-profile', 'product');
```

They compose freely — e.g. `dark` + `compact` + `product` for a night-mode ERP dashboard.

### Two profiles, one brand
The print brand was tuned for **impact** (big Montserrat, expressive 3-colour play); an
ERP is tuned for **legibility and density**. So the system runs two profiles:
- **Brand** (default) — marketing/website/decks: full expressive defaults.
- **Product** (`data-profile="product"`) — Nucleus & internal tools: UI font, tighter
  contrast, tabular figures. Plus the ERP component patterns below.

**Colour discipline in product UI:** treat **red and yellow as semantic only**
(danger / warning) — never as decorative base colours — and reserve the saturated
`--fh-color-danger`/`-warning` for small accents/controls; for large counts use the
calmer `…-text` tokens or the `.fh-stat--danger/--warning/--success` value tones, so a
dashboard doesn't become a wall of alarm.

### ERP component patterns (v1.1)
- **Filter toolbar:** `.fh-toolbar` (+ `--between`, `__spacer`) with **auto-width**
  controls `.fh-select--auto` / `.fh-input--auto` (the default form controls are
  full-width and would stack in a row).
- **Inline field:** `.fh-field--inline` (label beside control).
- **Tabular numerals:** on by default in `.fh-table`; `.fh-u-tabular` elsewhere.
- **Calmer KPIs:** `.fh-stat--{primary,success,warning,danger}`.
- **UI font utility:** `.fh-u-font-ui` (and `font-ui` in Tailwind).

---

## Design tokens

Two tiers. **Components only ever read the semantic layer**, so re-skinning means
re-mapping semantic tokens — primitives stay put.

**Primitives** — raw, theme-agnostic:
`--fh-blue-600`, `--fh-red-600`, `--fh-yellow-400`, `--fh-neutral-50…950`,
`--fh-space-4`, `--fh-radius-md`, `--fh-text-xl`, `--fh-shadow-md`, …

**Semantic** — purpose-based, theme-aware:
`--fh-color-bg`, `--fh-color-surface`, `--fh-color-text`, `--fh-color-primary`,
`--fh-color-primary-fg`, `--fh-color-danger`, `--fh-control-height`, …

```css
/* build a custom component on the tokens — it themes itself automatically */
.my-widget {
  background: var(--fh-color-surface);
  color: var(--fh-color-text);
  border: 1px solid var(--fh-color-border);
  border-radius: var(--fh-radius-lg);
  padding: var(--fh-space-6);
}
```

### Colour roles

| Role | Brand colour | Notes |
|------|--------------|-------|
| **Primary** | Blue `#005BAA` | Main actions, links, focus. The "guide" colour. |
| **Secondary** | Red `#B8292F` | Brand accent / the "child" colour. |
| **Accent** | Yellow `#F2C418` | Sparingly (the 45/45/10 rule). **Dark text only** — yellow fails contrast with white. |
| **Success** | Green (derived) | Not a brand colour; added for system states only. |
| Info / Warning / Danger | Blue / Yellow / Red | Mapped onto the brand palette. |

The guidelines' **45 / 45 / 10** proportion (blue + red bases, yellow accent) is
encoded in the `.fh-proportion` helper and reflected in the role weighting.

---

## Component classes (cheat sheet)

| Area | Classes |
|------|---------|
| Buttons | `.fh-btn` + `--primary --secondary --accent --success --danger --outline --ghost --subtle --link`, sizes `--sm --lg --block --icon`, `.fh-btn-group` |
| Forms | `.fh-field` `.fh-label` `.fh-input` `.fh-textarea` `.fh-select` `.fh-check` `.fh-switch` `.fh-input-group` `.fh-help` `.fh-error` (+ `.is-invalid`) |
| Data | `.fh-table` (`--striped --hover --bordered --sticky`, `__check` + `tr.is-selected`) `.fh-stat` `.fh-pagination` `.fh-bulkbar` |
| Flows | `.fh-stepper` (steps: `is-complete is-active is-danger`) `.fh-person` (avatar + name + meta cell) |
| People | `.fh-tree` (org hierarchy / node picker) `.fh-board` (pipeline kanban, `is-dragging is-over`) `.fh-timeline` `.fh-facegrid` (photo roster / attendance wall, `--present --absent --late`, `.is-selected`) |
| Content | `.fh-card` `.fh-badge` `.fh-chip` `.fh-alert` `.fh-avatar` |
| Navigation | `.fh-navbar` `.fh-sidebar` (`.fh-appshell`) `.fh-tabs` `.fh-breadcrumb` `.fh-menu` |
| Feedback | `.fh-modal` (`--confirm` + `.fh-modal__badge`) `.fh-toast` / `.fh-toaster` `.fh-empty-state` `.fh-tooltip` `.fh-progress` `.fh-spinner` `.fh-skeleton` |
| Layout | `.fh-container` `.fh-stack` `.fh-cluster` `.fh-grid` |
| Type | `.fh-display` `.fh-h1…h6` `.fh-subhead` `.fh-lead` `.fh-eyebrow` `.fh-caption` |

See [`docs/index.html`](docs/index.html) for live examples of all of them.

---

## Accessibility

- Brand blue (6.8:1) and red (6.2:1) pass **WCAG AA** with white text.
- Brand **yellow is dark-text only** (10.8:1 with near-black; only ~1.7:1 with
  white) — the tokens enforce this (`--fh-color-accent-fg` / `--fh-color-warning-fg`
  are dark).
- Visible `:focus-visible` rings on every interactive element.
- `prefers-reduced-motion` is honoured (animations/transitions disabled).
- Body text and muted text clear AA on both light and dark surfaces.

Contrast can be re-checked any time with `python scripts/check_contrast.py`.

---

## Using the tokens in other formats

- **Tailwind CSS / Next.js / React:** use the generated preset —
  `presets: [require('@fountainhead/design-system/tailwind-preset')]`. Brand ramps
  (`fh-blue-600`) are static hex; semantic colours (`bg-primary`, `text-foreground`)
  resolve to CSS vars and flip with `data-theme` / `data-density`. Full walkthrough in
  [INTEGRATION.md](INTEGRATION.md), with copy-paste files in [examples/nextjs/](examples/nextjs).
- **TypeScript:** `import { fhColor, fhChartCategorical } from "@fountainhead/design-system/tokens.ts"`
  — hex values for charts/canvas where CSS vars aren't convenient.
- **Sass:** `@use "tokens/fountainhead";` → `$fh-blue-600`, `@include fh-up("lg") { … }`
- **JS / Figma Tokens / Style Dictionary:** consume `tokens/tokens.json` (W3C format).

The Tailwind preset (`tailwind/fountainhead-preset.js`) and `tokens/tokens.ts` are
**generated** by `scripts/generate_tokens.py` — never edit them by hand.

---

## Regenerating assets (maintainers)

The token and logo files are reproducible from the brand PDF via Python
(`pip install pymupdf pillow`):

```bash
python scripts/generate_tokens.py   # rebuild tokens/tokens.json
python scripts/extract_logo.py      # re-extract logo PNGs from the brand manual
python scripts/check_contrast.py    # print colour ramps + WCAG contrast report
```

> The logo PNGs are reference renders extracted from *Brand Guidelines 2025*.
> For print or large-format use, source the original **vector** (SVG/EPS) files
> from the brand owner (Contours) when available.

---

## Versioning

> From v1.10.0 releases are cut by **release-please** (merge the release PR → tag +
> GitHub Release + [CHANGELOG.md](CHANGELOG.md)); entries below are the narrative summary.

**v1.13.0** — **faces** (the teacher-facing people wall). `.fh-facegrid` — photo roster
tiles with an **initials fallback that doubles as the photo-consent-off state** (no `<img>`
= fallback; never an error), attendance marking states `--present/--absent/--late` reusing
the `.fh-mark` tones + corner `__mark` glyph, `.is-selected` for picker use; compact-density
sizing for tablet walls; Beacon hover lift. New archetype `?page=faces` (attendance-by-faces +
roster/"who's in my class" + staff variants) and the **class photo-sheet** print
(`erp-print.html?doc=classsheet`) for substitutes/invigilation. Recipes + a11y in
INTEGRATION §7b/§7c.

**v1.12.0** — **money for people** (unblocks Compensation & Payroll — the last HRIS gate).
The **payslip** print template (`erp-print.html?doc=payslip`: masked identifiers,
earnings/deductions pair, net-pay band with amount-in-words, YTD strip) and the **payroll
archetype** (`erp-archetypes.html?page=payroll`: salary-structure table with component-type
badges + frozen-first pay-run register with status chips). Plus the **form-builder (FDC)
checkpoint** (`?page=formbuilder`) — verdict: composes entirely from existing primitives,
no new archetype CSS (selected-field ring + insertion marker are recipe-only). No new
component classes; recipes in INTEGRATION §7b.

**v1.11.0** — **people & hierarchy** (unblocks the HRIS build, starting with Recruitment).
`.fh-tree` — the org hierarchy: `details`-based expand/collapse branches, composable rows
(labels + type badges + `.fh-person` postings), `.is-selected` for **node-picker** use
(postings, role scopes, approval chains). `.fh-board` — pipeline/kanban columns + cards
with `is-dragging`/`is-over` DnD hooks (drag logic is consumer JS). `.fh-timeline` —
activity history with toned dots (candidate events, leave history, audit trails). Plus the
**offer-letter** print template (`erp-print.html?doc=offer`) and two new archetype pages:
`?page=org` and `?page=recruitment` (board + side timeline). Guidance in INTEGRATION §7b/§7c.

**v1.10.0** — first automated release: CI guards (duplicate-version, token-sync) +
release-please; Next.js kit refreshed to Beacon (drawer shell, toast/confirm React
recipes); token "drift" fixed (contrast reads shipped values; LF-stable generator);
drawer-scrim grid bug fixed; style-guide catch-up + a11y notes. See CHANGELOG.md.

**v1.9.0** — **governance & comms** (opens the last core-module gates: Settings, Staff
roles, Comms, Admissions offers). The **settings-page archetype** (grouped cards + save
footer + a `.fh-card--danger` danger zone) and the **comms-composer archetype** (audience
chips with consent-filtered count, subject/body, schedule row, send footer) — both in
`erp-archetypes.html?page=settings|comms`. `.fh-actingas` (+ `__label __name __role`)
promotes the console's role-scoped identity block; `.fh-spinner--sm` for inline/button
use; scoped P2 close-out (alert/skeleton/tabs/menu validated in use across the archetype
pages).

**v1.8.0** — **field ops & mobility** (unblocks Transport + Attendance). Sidebar grows
**depth + a drawer**: collapsible `details.fh-sidebar__group` submenus (`.fh-sidebar__sub`,
`__chev`), sticky + `overflow-y` scrolling rail, and an **opt-in mobile drawer**
(`.fh-appshell--drawer` + `.is-nav-open` + `__scrim` + `.fh-navtoggle` — default mobile
stacking unchanged). New patterns: `.fh-mark` attendance toggles (`--present --absent
--late`), the `.fh-cal` month grid (day-type tints `--holiday --break --event`,
`is-today/is-outside`), and `.fh-mapframe` chrome (toolbar/legend/side-panel over a
third-party map canvas). Demos: `erp-archetypes.html?page=attendance|calendar|map`.

**v1.7.0** — **data-viz layer for dashboards.** A valence-neutral **diverging scale**
(`--fh-color-diverging-neg-strong` → `-neg` → `-neutral` → `-pos` → `-pos-strong`) for signed
deltas (variance / over↔under / budget), plus **chart chrome** (`--fh-color-chart-reference`
for benchmark/target lines — neutral, never a data series — and `--fh-color-chart-grid`).
**Format parity:** the v1.2 soft tokens and all of the above now emit to `tokens.json`, the
Tailwind preset (`bg-diverging-pos`, `bg-danger-soft`, `border-chart-grid`) and typed `tokens.ts`
(`fhChartSoft`, `fhChartDiverging`, `fhChartReference`) — so canvas/SVG and tokens.json consumers
get them, not just CSS. Guidance: a benchmark is a *reference line*, not a competing series;
large signed-delta fills use the diverging scale (soft mids), reserve the saturated `-strong`
ends for magnitude. Reminder: `data-density="compact"` only tightens rows built with `.fh-table`.

**v1.6.0** — **money & paper** (unblocks the Fees module). A new **print layer**
(`css/print.css`, imported last): `.fh-sheet` paper documents (+ `--a5 --card`,
`__head/__doc/__foot/__sign`), app chrome auto-hidden under `@media print`, and
`.fh-print-only` / `.fh-u-print-hidden` / `.fh-print-break` helpers — with reference
templates in [`docs/examples/erp-print.html`](docs/examples/erp-print.html) (fee
receipt A5, progress report A4, CR80 ID card). The **grade grid**: `.fh-grade--1…7`
chips on the brand-blue ramp (1 red-tinted, `--na` dashed), `.fh-table--frozen-first`
sticky first column (striped/hover/product-aware), `.fh-table__center`, and the
term-switcher state `.fh-btn.is-active` — demoed in `erp-archetypes.html?page=grid`.

**v1.5.0** — **CRUD foundations** (unblocks the Students module). Page archetypes as
reference implementations in [`docs/examples/erp-archetypes.html`](docs/examples/erp-archetypes.html)
(`?page=form|detail|wizard`) — the first Beacon **form page** (sectioned cards, validation
states, action footer), a **detail/profile page** (person header + tabs + kv cards), and a
**wizard** (stepper + step body + footer) — plus the blessed **list-page recipe** and the
**icon / dual-logo conventions** in INTEGRATION.md §7b. Flow patterns: `.fh-stepper`
approval pipeline (`is-complete/is-active/is-danger`), `.fh-person` identity cell, table
row-selection (`.fh-table__check` + `tr.is-selected`) with `.fh-bulkbar`, the previously
missing `[data-density="compact"][data-profile="product"]` composition rules, and
`exports` now expose `./package.json`.

**v1.4.0** — **the feedback layer**: `.fh-empty-state` (+ `--plain --page --danger`) for
no-data / filtered / error / access-denied moments; `.fh-toast` + `.fh-toaster`
(success/warning/danger, CSS-only — showing/dismissing is consumer JS); the
`.fh-modal--confirm` destructive-action preset with `.fh-modal__badge`; and `.fh-tooltip`
now themes correctly via new `--fh-color-inverse-surface/-fg` tokens (was hardcoded
neutral-900). All token-driven — light/dark/compact/product compose automatically.

**v1.3.0** — **product "Beacon" identity** on `data-profile="product"`: a deep-navy
app-shell sidebar with a yellow active accent, KPI cards with a colour-coded **left**
accent bar (driven by `.fh-stat--*`), brand-ticked card titles, a tinted table header,
and bolder controls — all scoped to the product profile, so marketing/brand surfaces are
untouched. The product profile now also standardises on **Plus Jakarta Sans** for
headings + body (softer semibold weights), and the ERP example ships real inline SVG
icons. No brand-anchor or token-value changes — nothing regenerated.

**v1.2.0** — **soft data-viz tones** (`--fh-color-danger-soft` / `-warning-soft` /
`-success-soft`) for large chart fills (donuts, bars, heatmaps) so a dashboard full
of "overdue" reads as information, not alarm — keep the saturated tokens for small
accents/text. Toolbar selects gain a `max-width` so long-option selects don't balloon.

**v1.1.1** — controls inside `.fh-toolbar` auto-size to content, so wrapping a filter
row in `.fh-toolbar` keeps it inline (no per-control `--auto` needed).

**v1.1** — the **product/ERP profile** (`data-profile="product"`): UI font
(`--fh-font-ui`), tighter contrast, tabular numerals; plus ERP component patterns
(`.fh-toolbar`, `.fh-select--auto`/`.fh-input--auto`, `.fh-field--inline`,
`.fh-stat--*` tones) and a colour-discipline guideline. Backward-compatible —
existing consumers are unaffected until they opt in.

**v1.0** — initial system: tokens (light/dark/compact), full CSS component
library, logo assets, living style guide. Built from *Fountainhead Brand
Guidelines 2025*.
