# Fountainhead Fees — production image.
#
# Portable: a platform that builds a Dockerfile (Railway / Render / Fly / Cloud Run) uses this
# as-is, and so does a self-hosted VM. Same shape as the event-management app's Dockerfile,
# EXCEPT @fountainhead/design-system: that app fetches it as a private git dependency (needing a
# build-time GitHub token); this app vendors the package's static files into vendor/ instead,
# imported by relative path (see app/layout.tsx and tailwind.config.ts) rather than installed as
# an npm dependency — an npm `file:` dependency installs as a symlink, which Next's webpack CSS
# handling doesn't resolve reliably. Vendoring is a documented option in the package's own
# INTEGRATION.md, and it also removes an entire class of build-time-secret failure — Railway's
# Dockerfile builds turned out not to reliably forward a service variable into a Docker ARG on
# this project, so a design that needs no secret at all to build is more robust than fighting that.
#
# Single stage on purpose: keep devDependencies so the SAME image runs `prisma migrate deploy`
# (the Prisma CLI), the one-off `npm run seed` (tsx), and `next start`.
FROM node:22-bookworm-slim

# openssl: Prisma's query engine needs it at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Install dependencies (incl. devDeps — needed for `next build`, the Prisma CLI, and tsx).
#    Copied separately from the source so this layer is cached across ordinary code changes.
COPY package.json package-lock.json ./
RUN npm ci

# 2) Copy the source and build. Every DB-reading page is force-dynamic, so the build never
#    touches the database; the placeholder DATABASE_URL is scoped to THIS layer (never persisted
#    to runtime) and only satisfies Prisma client construction. The host injects the real one at
#    runtime — a missing DATABASE_URL then fails loudly rather than silently using this placeholder.
COPY . .
RUN export DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
  && npx prisma generate \
  && npm run build

ENV NODE_ENV=production
EXPOSE 3107

# On every start: apply pending migrations (idempotent — safe to repeat), then serve. Honour
# $PORT when the platform sets one (Railway does); fall back to 3107 (the local/VM case).
# Seeding is a SEPARATE one-off step — run `npm run seed` manually against the deployed DB.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p ${PORT:-3107}"]
