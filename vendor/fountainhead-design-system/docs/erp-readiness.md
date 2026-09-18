# ERP Design Readiness — master roadmap

**Goal:** before each Nucleus ERP module is built, every screen archetype, component, and
pattern it needs already exists in the design system — so app teams **compose** screens
instead of designing them. A stray ad-hoc pattern in Nucleus is a DS gap by definition.
This doc builds on [`../ROADMAP.md`](../ROADMAP.md) (P0/P1/P2 backlog + pilot findings)
and sequences it against the module build order in [`nucleus-handoff.md`](nucleus-handoff.md) §C.
Status date: 2026-07-03. **v1.13.0 (faces) is current — every core module AND the
full HRIS suite (Recruitment → offer → induction, Leaves, Staff core, Compensation & Payroll)
is design-ready.** Infra lane: DONE (CI blocking guards + release-please live since v1.10.0).
The FDC form-builder checkpoint is closed (composes from primitives, no new archetype);
v1.13 closed the photo-roster gap (attendance-by-faces, class rosters, staff walls, class-sheet print).

---

## 1. ERP module → screen inventory

Archetypes: **list · detail · form · wizard · dashboard · calendar · map · print · comms-composer · settings**.

| Module | Screens → archetype |
|---|---|
| **Dashboard / Overview** | Dashboard → dashboard *(reference built)* · Notifications → list |
| **Auth / Settings** | Login (Cloudflare Access — mostly Cf-hosted) → form · Profile → detail+form · Settings (school, academic year/terms, roles & permissions, branding) → settings · Audit log → list |
| **Students** | List → list · Profile → detail · Add/Edit → form · Bulk import → wizard · ID cards → print |
| **Fees** | Fee structure → settings · Invoices → list · Collect payment → form · Receipt → print · Defaulters → list · Reports → dashboard+print |
| **Transport** *(Student Travel & Safety)* | Route list → list · Route planner → map · Stops → list+form · Vehicles/Drivers → list+detail · Capacity → dashboard |
| **Attendance** | Mark (daily) → form (grid) · Reports → dashboard+calendar |
| **Admissions** | Enquiry → list+form · Application → form+wizard · Review → detail · Offer → detail+print · Enrolment → wizard *(one pipeline: stepper spans all five)* |
| **Staff** | Directory → list · Profile → detail · Roles → settings |
| **Comms** | Announcements → list+comms-composer · Circulars → list+comms-composer+print |
| **Operator console / tenancy** *(live in `C:\Dev\nucleus\app` today)* | Overview + provisioning → dashboard+form · §12 Acceptance runner → list · Access Explorer → form+list · Directory → list · Tenant detail (lifecycle) → detail · Setup wizard → wizard · Calendar authoring (maker-checker write path) → calendar+form · Accept invitation → form · Help → doc page |

| **HRIS suite** *(next build focus)* | Recruitment: pipeline → **board** (+ per-candidate stepper + timeline) · Candidate detail → detail+timeline · Offer → **print (offer letter)** · Induction → wizard+checklist. Leaves/credits: request → form + maker-checker (confirm/toast) · balances → stat+progress · calendars → fh-cal · history → timeline. Staff core: hierarchy → **org tree** · postings/roles → tree node-picker + settings. Staff attendance → mark grid. Compensation/Payroll: salary-structure + pay-run register (`?page=payroll`) → **payslip print (`?doc=payslip`, v1.12 ✅)**. |

**Later modules** (specced in `C:\Dev\nucleus-erp-decisions` — Health, Pastoral, ARR/gradebook,
Career Counselling, Alumni, Store, Forms-builder, AI layers) reuse the same archetypes; ARR is
the real consumer of the grade-grid. v1.11 added the people patterns (tree/board/timeline) the
HRIS suite needed; the form-builder (FDC) checkpoint closed at v1.12: **it composes from existing
primitives** (`?page=formbuilder` — palette/canvas/properties; no new archetype CSS).

---

## 2. Archetype & pattern coverage matrix

Legend: ✅ shipped · 🧪 validated-in-pilot · 📐 designed-not-promoted · ❌ missing · → vX.Y = assigned release.
Provenance: **P0/P1/P2** = ROADMAP backlog item · **new** = first identified in this audit.

### Screen archetypes

| Archetype | Status | Evidence / gap | Needed by | Release |
|---|---|---|---|---|
| List page | ✅ | Validated on Nucleus Directory; recipe documented in INTEGRATION.md §7b | every module | v1.5 ✅ |
| Detail / profile page | ✅ | `erp-archetypes.html?page=detail` (person header + tabs + kv/stat cards) | Students, Staff, Fees, Admissions, Transport | v1.5 ✅ |
| Form page | ✅ | `erp-archetypes.html?page=form` — first Beacon form; controls validated under Jakarta | every write module | v1.5 ✅ |
| Wizard / multi-step | ✅ | `erp-archetypes.html?page=wizard` (stepper + step body + footer) | Students import, Admissions, tenant setup | v1.5 ✅ |
| Dashboard | 🧪 | `docs/examples/erp-dashboard.html` canonical; KPI/stat cards validated on console Overview | Dashboard, Fees/Transport/Attendance reports | done |
| Calendar | ✅ | `.fh-cal` month grid (day-type tints, today/outside states); demo `?page=calendar` | Attendance reports, Calendar module (CAL-) | v1.8 ✅ |
| Map | ✅ | `.fh-mapframe` chrome (toolbar/legend/panel over third-party canvas); demo `?page=map` | Transport route planner | v1.8 ✅ |
| Print | ✅ | `css/print.css` layer + receipt/report/ID-card templates (`erp-print.html`) | Fees receipts, ID cards, report cards, offers, circulars | v1.6 ✅ |
| Comms-composer | ✅ | `erp-archetypes.html?page=comms` (audience chips + consent count, subject/body, schedule, send footer) | Comms, Admissions offers | v1.9 ✅ |
| Settings page | ✅ | `erp-archetypes.html?page=settings` (grouped cards + save footer + `.fh-card--danger` zone) | Settings/Auth, Fees structure, Staff roles | v1.9 ✅ |

### Cross-cutting patterns

| Pattern | Status | Evidence / gap | Needed by | Release |
|---|---|---|---|---|
| Empty / error / 404 states | 📐 | Composed inline in Nucleus `DirectoryTable`; being promoted as `fh-empty-state` (P0 #1) | every module | **v1.4 ✅** |
| Toast / async feedback | ❌ | Nothing exists; imports/bulk actions have no feedback (P0 #2) | every write module | **v1.4 ✅** |
| Confirm dialog (destructive) | ❌ | `fh-modal` base-only; no confirm pattern (P0 #3) | every write module, lifecycle ops | **v1.4 ✅** |
| `fh-tooltip` theme fix | ✅ (buggy) | Hardcodes neutral-900/50, ignores theme+profile (P1 bug) | all | **v1.4 ✅** |
| Table: base + tinted header | 🧪 | Striped/hover/tinted validated light+dark in pilot | all list pages | done |
| Table: frozen first column (grade-grid) | ✅ | `.fh-table--frozen-first` + `.fh-grade--1…7` (shape from dp-results preview); demo `erp-archetypes.html?page=grid` | ARR/gradebook, Attendance grid | v1.6 ✅ |
| Table: row selection + bulk-action bar | ✅ | Shipped on main post-v1.4.0: `.fh-table__check` + `tr.is-selected` + `.fh-bulkbar` | Students, Fees defaulters, Comms audiences | v1.5 ✅ |
| Stepper / approval pipeline | ✅ | Shipped on main post-v1.4.0: `.fh-stepper` (`is-complete/is-active/is-danger`), compact-aware | Admissions, all maker-checker writes, wizards | v1.5 ✅ |
| Person-cell (avatar + name + meta) | ✅ | Shipped on main post-v1.4.0: `.fh-person` (+ `fh-avatar`) | Students, Staff, Admissions, any people list | v1.5 ✅ |
| Form controls validated under product | ✅ (unvalidated) | Controls shipped base-only; Jakarta+compact validation pending (P1) | every form | v1.5 |
| `compact` + `product` composition | ✅ | Shipped on main post-v1.4.0 (stat/card/sidebar/progress/stepper) | dense lists, attendance grid, gradebook | v1.5 ✅ |
| Term / academic-year switcher | ✅ | `.fh-btn-group` + `.fh-btn.is-active` (grid demo header) | Fees, Attendance, ARR, dashboards | v1.6 ✅ |
| "Acting as" identity block | ✅ | `.fh-actingas` (+ __label/__name/__role), promoted from the console | operator console, Staff/roles, audit surfaces | v1.9 ✅ |
| Mobile drawer + sidebar depth | ✅ | Opt-in `.fh-appshell--drawer` + scrim + `.fh-navtoggle`; `details.fh-sidebar__group` submenus; scrolling rail | Transport/Attendance field use, all mobile | v1.8 ✅ |
| Dark-mode Beacon sweep | ✅ | Scoped: v1.3→v1.7 components spot-validated dark (pilot + archetype pages); re-check as components evolve | all | v1.8 ✅ |
| Icon + dual-logo convention doc | ✅ | Documented in INTEGRATION.md §7b | every module team | v1.5 ✅ |
| Alert / spinner / skeleton / tabs / breadcrumb / menu under Beacon | ✅ | `fh-spinner--sm` shipped; rest validated in use across the archetype pages (scoped P2 close-out) | all | v1.9 ✅ |
| Appshell / sidebar / navbar / badge / pagination / toolbar | 🧪 | Validated zero-change, light and dark, in pilot | all | done |
| Package `exports` fix (`./package.json`) | ✅ | Shipped v1.5.0 | consumers/tooling | v1.5 ✅ |
| Org tree + node picker (`fh-tree`) | ✅ | `?page=org` — details-based branches, composable rows, `.is-selected` picker state | Staff hierarchy, postings, role scopes, approval chains | v1.11 ✅ |
| Pipeline board (`fh-board`) | ✅ | `?page=recruitment` — columns/cards + `is-dragging`/`is-over` DnD hooks | Recruitment stages, task lanes | v1.11 ✅ |
| Timeline (`fh-timeline`) | ✅ | `?page=recruitment` side panel — toned dots + rail | candidate/leave/audit history on detail pages | v1.11 ✅ |
| Offer-letter print template | ✅ | `erp-print.html?doc=offer` | Recruitment offers | v1.11 ✅ |
| Payslip print template | ✅ | `erp-print.html?doc=payslip` — masked IDs, earnings/deductions pair, net-pay band + words, YTD strip | Payroll | v1.12 ✅ |
| Salary-structure + pay-run patterns | ✅ | `?page=payroll` — structure table w/ component badges; frozen-first register w/ status chips | Compensation & Payroll | v1.12 ✅ |
| Form-builder (FDC) archetype | ✅ (checkpoint) | `?page=formbuilder` — composes from primitives; **no new CSS needed** (verdict recorded) | Forms-builder module | v1.12 ✅ |
| Face grid / photo roster (`fh-facegrid`) | ✅ | `?page=faces` — attendance wall (mark tones), roster + picker, initials fallback = consent-off state | Attendance (teacher mode), Students/Staff rosters, pickup verification | v1.13 ✅ |
| Class photo-sheet print | ✅ | `erp-print.html?doc=classsheet` — substitutes/invigilation | Students, Attendance, exams | v1.13 ✅ |

---

## 3. Phased DS release plan

Sequenced so each ERP module's dependencies ship **before** that module
(build order per handoff: Students → Fees → Transport → Attendance → Admissions → Staff/Settings).

### v1.4.0 — Feedback layer *(SHIPPED 2026-07-02)*
`fh-empty-state` · `fh-toast` · `fh-modal--confirm` · `fh-tooltip` theme fix.
Retrofits the live operator console; prerequisite for every write flow.

### v1.5.0 — CRUD foundations *(SHIPPED 2026-07-02 — Students unblocked; Beacon style-guide section continues to grow per release)*
- List-page archetype documented as the blessed template (P0 #4).
- Form-page archetype under product (P0 #5) + form controls validated under Jakarta/compact (P1).
- Detail/profile-page archetype (new).
- Wizard shell + stepper/approval-pipeline pattern (P1 + new) — also serves live maker-checker.
- Person-cell composition (new) · table row-selection + bulk-action bar (new).
- `[data-density="compact"][data-profile="product"]` composition (P1).
- Icon + dual-logo convention doc (P1) · package `exports` fix (P2) · Beacon section in the living style guide (P2, partial — grows per release).

### v1.6.0 — Money & paper *(SHIPPED 2026-07-02 — Fees unblocked; Students ID cards complete)*
- Print foundation: `@media print` reset + templates — fee receipt, report sheet, ID card (P0 #6).
- Grade-grid / frozen-first-column table (P0 #7 — confirm shape against ibdp-results first; reused by Attendance in v1.8).
- Term / academic-year switcher pattern (new).
- Amount/currency display guidance (₹, `en-IN`, tabular numerals — doc only; tokens ✅).

### v1.7.0 — Data-viz layer *(SHIPPED 2026-07-02, from the ibdp-results pilot)*
Diverging scale (`--fh-color-diverging-*`) + chart chrome (`--fh-color-chart-reference/-grid`) with
format parity across tokens.json / Tailwind preset / tokens.ts (see README) — landed in parallel
with field ops from the second pilot.

### v1.8.0 — Field ops & mobility *(SHIPPED 2026-07-02 — Transport + Attendance unblocked)*
- Map-canvas chrome pattern: DS toolbar/legend/side-panel around a third-party map (new).
- Mobile drawer for the navy rail + sidebar submenu depth/scroll (P1).
- Attendance mark-grid: frozen-col reuse + tap-friendly toggle cells (new).
- Calendar month/week grid pattern (new; promotes the console calendar screen's needs).
- Full dark-mode QA sweep under Beacon (P1).

### v1.9.0 — Governance & comms *(SHIPPED 2026-07-02 — all core-module gates now open)*
- Settings-page archetype (sectioned nav + form groups + danger zone) (new).
- Comms-composer archetype (new).
- "Acting as" identity block promoted from the console (pilot finding).
- P2 polish sweep: alert/spinner/skeleton/navbar/tabs/breadcrumb/menu tuned under Beacon + `fh-spinner--sm`.
- Checkpoint: does the Forms-builder module (FDC-) need a new archetype? Scope v1.10 if so.

### v1.11.0 — People & hierarchy *(SHIPPING 2026-07-02 — unblocks the HRIS build, starting with Recruitment)*
`fh-tree` (org hierarchy + node picker) · `fh-board` (recruitment pipeline/kanban) ·
`fh-timeline` (activity history) · offer-letter print template · node-picker/DnD/a11y
guidance in INTEGRATION §7b/§7c. Leave-balance = stat+progress (pattern, no new CSS);
induction checklist = wizard + fh-check (pattern).

### v1.12.0 — Money for people *(SHIPPED 2026-07-03 — Compensation & Payroll unblocked; HRIS fully design-ready)*
- Payslip print template (`erp-print.html?doc=payslip`): masked PAN/bank/UAN, earnings +
  deductions side-by-side, net-pay band (amount + words), YTD strip, leave balances.
- Payroll archetype (`?page=payroll`): salary-structure table (component/basis/amount with
  earning·deduction·benefit badges), frozen-first pay-run register (person col + money cols +
  paid/queued/hold chips), month switcher, maker-checker note.
- Form-builder (FDC) checkpoint (`?page=formbuilder`): palette→canvas→properties composed
  from existing primitives — **verdict: no new archetype CSS**; selected-field ring +
  insertion marker stay recipe-only. No new component classes shipped in v1.12.

### v1.13.0 — Faces *(SHIPPED 2026-07-03 — the photo-roster gap, teacher-facing)*
- `.fh-facegrid`: photo roster tiles — photo when it exists AND consent allows, otherwise
  the initials fallback **as a first-class state**; attendance marking `--present/--absent/
  --late` (fh-mark tones) + corner `__mark`; `.is-selected` picker state; compact-density
  tablet sizing; Beacon hover lift. Demos use synthetic silhouettes, never real faces.
- Archetype `?page=faces`: attendance-by-faces (tap-to-cycle buttons, summary badges,
  maker-checker submit) + roster/"who's in my class" + staff wall variants.
- Class photo-sheet print (`?doc=classsheet`) for substitutes/invigilation.
- Recipes + a11y (aria-label carries person+state; alt=""; lazy-load) in INTEGRATION §7b/§7c.

### Parallel lane — infra & automation *(trigger: when design stabilizes ≈ after v1.5)*
From ROADMAP "Build later", in order; each hop human-gated:
1. Fix token-ramp drift (decide canonical blue-700 etc., sync `tokens.css` ⇄ generated files) — precondition for 2.
2. CI validation: contrast check + token-sync check (+ optional stylelint) on PR/main.
3. release-please (Conventional Commits → release PR → tag + GitHub Release).
4. Publish-target decision: keep git-tag installs (recommended) vs GitHub Packages.
5. GitHub Pages living style guide.
6. Renovate/Dependabot in the Nucleus repo (consumer bump PRs).

---

## 4. Per-module readiness gates

| Module | Ready to build when… |
|---|---|
| Dashboard | **Now** (v1.3 shipped; v1.4 adds empty states for widgets). |
| Operator console | Live; retrofit v1.4 feedback layer; adopt v1.5 stepper for maker-checker screens. |
| Students | **Ready now** — v1.4 + v1.5 shipped (list template, form/detail/wizard archetypes, person-cell, bulk bar). ID cards follow v1.6 print. |
| Fees | **Ready now** — v1.6 shipped (print receipts, term-switcher, frozen-col) on top of v1.5 forms + v1.4 confirm/toast. |
| Transport | **Ready now** — v1.8 shipped (map chrome, mobile drawer) on top of v1.5 lists/forms. |
| Attendance | **Ready now** — v1.8 shipped (mark-grid, calendar grid; frozen-col + term-switcher from v1.6); v1.13 adds the teacher-facing **attendance-by-faces** mode. |
| Admissions | v1.5 (stepper pipeline, forms, wizard) + v1.6 (offer/print); i.e. buildable after v1.6. |
| Staff | **Ready now** — v1.5 list/detail/person-cell + v1.9 settings archetype for Roles. |
| Comms | **Ready now** — v1.9 shipped (composer; print for circulars from v1.6). |
| Settings/Auth | **Ready now** — v1.9 shipped (settings archetype, acting-as); Login itself is Cloudflare-hosted (app-side). |
| HRIS — Recruitment | **Ready now** — v1.11 (board/stepper/timeline, offer print); **piloted live on the Nucleus console** (`/recruitment` board + candidate detail, 2026-07-03). |
| HRIS — Leaves / Staff core | **Ready now** — v1.11 (tree/node-picker, fh-cal, mark grid, stat+progress balances). |
| HRIS — Compensation & Payroll | **Ready now** — v1.12 shipped (payslip print, salary-structure + pay-run patterns). |

---

## 5. Out of scope — app-side prerequisites (tracked in `C:\Dev\nucleus\docs\TODO.md`)

The DS covers look/composition only. Not covered here: the **Cloudflare Access gate** (deploy
is live but ungated), the **SQL-Server→Postgres ETL** / `PersonAlias` load contract, per-module
**business logic + §12-first acceptance criteria**, DPDP counsel sign-offs + credential rotation
(blockers before real data), and infra hardening (pooling, backups, observability). The handoff's
§B asks (Prisma schema, roles matrix, business rules) remain the input that turns these archetypes
into data-correct screens.

---

*Sources: `ROADMAP.md` · `docs/nucleus-handoff.md` · `README.md` · `C:\Dev\nucleus\CLAUDE.md`,
`docs\TODO.md`, `docs\STATUS.md`, `app\` routes · decisions repo `docs\specs\README.md` index.
Note: the Build Plan is not at `C:\Dev\nucleus\docs\prototypes\` (dir absent) — found at
`C:\Dev\nucleus-erp-decisions\docs\prototypes\Superstructure Foundation - Production Build Plan.md`;
its order (foundation phases → then admissions, fees, attendance, HR, ARR…) is compatible with the
handoff order used here. Screen inventory is per handoff §C, still awaiting §B confirmation.*
