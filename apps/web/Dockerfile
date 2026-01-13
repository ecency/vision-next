# syntax=docker/dockerfile:1.7
FROM node:20.12 AS base
WORKDIR /var/app

ARG PNPM_VERSION=10.18.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
ENV CI=true

# ---- manifests ----
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/wallets/package.json packages/wallets/package.json
COPY packages/renderer/package.json packages/renderer/package.json
COPY packages/render-helper/package.json packages/render-helper/package.json

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# ---- source ----
COPY . .

# ---- public build-time envs ----
ARG NEXT_PUBLIC_GMAPS_API_KEY
ARG NEXT_PUBLIC_GMAPS_MAP_ID
ENV NEXT_PUBLIC_GMAPS_API_KEY=${NEXT_PUBLIC_GMAPS_API_KEY}
ENV NEXT_PUBLIC_GMAPS_MAP_ID=${NEXT_PUBLIC_GMAPS_MAP_ID}

# ---- Sentry (make them visible to the build) ----
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_LOG_LEVEL=debug

# Single build that emits the EXACT assets we ship
RUN pnpm -r build

# Prune runtime deps for the web workspace
RUN pnpm deploy --filter @ecency/web --prod --legacy /var/app/.deploy-workdir \
  && rm -rf apps/web/node_modules \
  && mv /var/app/.deploy-workdir/node_modules apps/web/node_modules \
  && rm -rf /var/app/.deploy-workdir

# Re-apply next-ws patch after pnpm deploy (deploy creates fresh node_modules without the patch)
# Use node to run the CLI directly from node_modules
RUN cd apps/web && node node_modules/next-ws/dist/cli.cjs patch

# ---------- production ----------
FROM node:20.12 AS production
WORKDIR /var/app

ENV TINI_VERSION=v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/var/app/node_modules/sharp

ARG PNPM_VERSION=10.18.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy runtime artifacts from the single build
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
