# CLAUDE.md — fees-management

## What this is

A standalone fee proposal &amp; approval workspace for the six Fountainhead group schools (FSK,
FSM, FWGS, FPV, FPA, FALH). Each school defines its own grade bands and groups them into
programme stages (e.g. FSK's "EYP to MYP" vs "DP"; FSM's "EYP & PYP" vs "MYP & DP"), each stage
carrying a default YoY increment % that a new draft pre-fills — fully overridable per grade band.
A proposal moves through **Draft → Fees Group Coordinator → Head of Operations → Director →
Board of Trustees**; once the Board approves, that version becomes the school's official fee for
the academic year and any prior approved version for the same year is marked superseded.

**Scope is fee-setting and approval only.** No student-level billing, invoicing, or payment
tracking, and no competitor/market fee benchmarking — both explicitly out of scope for v1.

This is a sibling to the event-management prototype (`C:\Nirav - AI`) for the same school group
and deliberately follows its conventions (see below) so the two apps feel like one estate.

## Source of truth for the seed data

Real figures for **FSK** and **FSM** come from two workbooks supplied by the user:
`Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx` (FSK's approved 2026-27 fee) and
`Provisional fee 2027-28.xlsx` (the "10 Years Fees Kunkni"/"10 Years Fees Malgama" sheets).
`prisma/seed.ts`'s header documents exactly which cells each figure came from and where a stored
number is the app's engine-computed value rather than the exact filed rupee amount (a few rows
carry a 2-4 rupee legacy-rounding difference from the original FRC filing — see that file).
**FWGS**'s figures are real too — a 5-year IB Programme fee table the user supplied directly
(2026-09-18): four programmes (EYP/PYP/MYP/DP), each its own stage, all growing at a flat 10%
YoY; see the `FWGS` entry in `prisma/seed.ts` for the exact Year-1 anchor values.
**FPV, FPA, and FALH have no source data yet** — every grade band and figure for them is a
clearly-labelled placeholder (`FeeVersion.notes` says so) for the finance team to replace via the
Fee Builder before submitting a real proposal.

## Conventions (matched to the event-management app on purpose)

- **Engine pattern**: pure functions in `engine/*.ts`, no I/O/Prisma, string-literal unions for
  domain enums, co-located `*.test.ts` (vitest). `npm test` runs all of them.
- **Prisma**: `id String @id @default(cuid())`, `createdAt`/`updatedAt`, no native enums —
  `status`/`role` fields are `String` validated against the matching `engine/*.ts` union. Schema
  changes go through `npm run db:migrate` (never `prisma db push`) so `prisma/migrations/` stays
  the real history; the container would run `prisma migrate deploy` on deploy, same as the
  sibling app.
- **Approval chain**: `engine/approval.ts` is a direct port of the event-management app's
  Trip-Approval logic (`buildApprovalChain`/`computeApprovalState`/`isActionable`) — sequential
  gate, any rejection stops the chain, persisted as one `FeeApproval` row per step (the audit
  trail).
- **Rights**: Google sign-in + the same 8-domain org allowlist (`lib/auth-domains.ts`, fails
  closed) as layer one. Layer two is `AppUser`/`AppUserRight`, curated at `/settings/rights` by
  whoever's listed in `RIGHTS_ADMIN_EMAILS` (fails closed to `nirav.shah@fountainheadschools.org`
  — Head of Operations, Fountainhead group — when unset). Unlike the event-management app's flat
  AppUserRight (existence = permission), a grant here also carries a `role` (`SCHOOL_FINANCE |
  FEES_GROUP_COORDINATOR | HEAD_OF_OPERATIONS | DIRECTOR | BOARD_TRUSTEE`) — fee approval
  genuinely needs distinct capability tiers, not just campus scoping. `SCHOOL_FINANCE` is
  campus-scoped to one school; the four approval-chain roles always apply to every school. Being
  the rights admin is independent of holding any of these roles — Nirav Shah is seeded with only
  `HEAD_OF_OPERATIONS` (his real title), not all of them.
- **Design system**: same `@fountainhead/design-system` package/version as the event-management
  app (`.fh-card`/`.fh-table`/`.fh-badge--*`, `data-profile="product"`, Plus Jakarta Sans).
- **Local dev has no sign-in wall** (`middleware.ts` skips it outside `NODE_ENV=production`) and
  `getCurrentRights()` grants every role unrestricted when nothing is signed in locally — same
  dev/prod split as the sibling app, so you can click through the whole approval chain without
  seeding a session.

## Ports

Postgres on host **5440** (event-management holds 5439). Dev server on **3107**
(event-management runs on 3106).
