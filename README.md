# Fountainhead Fees

A fee proposal & approval workspace for the six Fountainhead group schools (FSK, FSM, FWGS, FPV,
FPA, FALH). Each school defines its own grade bands and programme-stage YoY increment %; a
proposal moves Draft → Fees Group Coordinator → Head of Operations → Director → Board of
Trustees before it becomes that school's official fee for the year.

**Out of scope for v1**: student-level billing/invoicing, payment tracking, and competitor fee
benchmarking.

## Run locally

```bash
docker compose up -d          # Postgres on localhost:5440
npm install
npm run db:migrate
npm run seed
npm run dev                   # http://localhost:3107
```

`npm test` runs the engine unit tests (fee math, projection compounding, the approval state
machine, rights predicates).

## Layout

- `engine/` — pure, unit-tested fee/approval/rights logic. No I/O.
- `lib/` — auth, rights, and Prisma wiring around the engine.
- `app/` — Next.js App Router pages and server actions.
- `prisma/schema.prisma` — data model; `prisma/seed.ts` — demo data (real figures for FSK, FSM,
  and FWGS; placeholder figures for FALH, FPV, and FPA).

See [CLAUDE.md](CLAUDE.md) for the conventions this app follows and why.
