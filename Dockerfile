# Fountainhead Fees — production image.
#
# Portable: a platform that builds a Dockerfile (Railway / Render / Fly / Cloud Run) uses this
# as-is, and so does a self-hosted VM. Same shape as the event-management app's Dockerfile.
#
# Single stage on purpose: keep devDependencies so the SAME image runs `prisma migrate deploy`
# (the Prisma CLI), the one-off `npm run seed` (tsx), and `next start`.
FROM node:22-bookworm-slim

# openssl: Prisma's query engine needs it at runtime. git: to fetch the private
# @fountainhead/design-system dependency during `npm ci` (the slim image has neither).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Install dependencies (incl. devDeps — needed for `next build`, the Prisma CLI, and tsx).
#    Copied separately from the source so this layer is cached across code changes.
COPY package.json package-lock.json ./
# @fountainhead/design-system is a private GitHub dependency. Rewrite GitHub remotes to HTTPS +
# a build-time token, run `npm ci`, then delete the credential — all in ONE layer so the token
# never lands in the image. GITHUB_TOKEN = a read-only, repo-scoped PAT set as a Railway variable.
ARG GITHUB_TOKEN
RUN set -eu; \
  if [ -n "${GITHUB_TOKEN:-}" ]; then \
    git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"; \
    git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"; \
    git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"; \
  fi; \
  npm ci; \
  rm -f /root/.gitconfig

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
