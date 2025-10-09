# syntax=docker/dockerfile:1.7
FROM node:20.12 AS base
WORKDIR /var/app

# Pin pnpm to match lockfile
ARG PNPM_VERSION=10.18.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV CI=true

# ---- copy workspace manifests first (for better caching) ----
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# copy only package.jsons from workspaces for dependency graph resolution
COPY apps/web/package.json apps/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/wallets/package.json packages/wallets/package.json
# (add more workspace package.json files as needed)

# install deps using the root lockfile
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- now bring the full source ----
COPY . .

# public build-time envs
ARG NEXT_PUBLIC_GMAPS_API_KEY
ENV NEXT_PUBLIC_GMAPS_API_KEY=${NEXT_PUBLIC_GMAPS_API_KEY}
ARG NEXT_PUBLIC_GMAPS_MAP_ID
ENV NEXT_PUBLIC_GMAPS_MAP_ID=${NEXT_PUBLIC_GMAPS_MAP_ID}

# If we need Sentry token during build
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" && \
    pnpm --filter @ecency/web build

# prune dev deps for runtime. "pnpm deploy" creates a trimmed node_modules for just
# the web workspace, preventing the root workspace prune from stripping Next.js.
RUN pnpm deploy --filter @ecency/web --prod --legacy /var/app/.deploy-workdir \
    && rm -rf apps/web/node_modules \
    && mv /var/app/.deploy-workdir/node_modules apps/web/node_modules \
    && rm -rf /var/app/.deploy-workdir

# ---------- production ----------
FROM node:20.12 AS production
WORKDIR /var/app

# tini
ENV TINI_VERSION=v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/var/app/node_modules/sharp

# same pnpm version for runtime "pnpm start"
ARG PNPM_VERSION=10.18.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# copy runtime artifacts
COPY --from=base /var/app/package.json ./package.json
COPY --from=base /var/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /var/app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /var/app/apps/web/package.json ./apps/web/package.json
COPY --from=base /var/app/apps/web/healthCheck.js ./apps/web/healthCheck.js
COPY --from=base /var/app/apps/web/public ./apps/web/public
COPY --from=base /var/app/apps/web/.next ./apps/web/.next
COPY --from=base /var/app/node_modules ./node_modules
COPY --from=base /var/app/apps/web/node_modules ./apps/web/node_modules

HEALTHCHECK --interval=15s --timeout=5s CMD node /var/app/apps/web/healthCheck.js
CMD ["pnpm", "start"]
