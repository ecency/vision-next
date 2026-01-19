# =============================================================================
# Ecency Self-Hosted Blog - Multi-stage Docker Build
# =============================================================================
# This Dockerfile builds a lightweight, static self-hosted blog powered by Hive.
#
# Build args:
#   CONFIG_JSON - JSON string with instance configuration (optional)
#
# Usage:
#   # Build with default config
#   docker build -t ecency/self-hosted .
#
#   # Build with custom config
#   docker build --build-arg CONFIG_JSON="$(cat config.json)" -t myblog .
#
#   # Run
#   docker run -p 3000:80 ecency/self-hosted
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/self-hosted/package.json ./apps/self-hosted/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/render-helper/package.json ./packages/render-helper/
COPY packages/wallets/package.json ./packages/wallets/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/self-hosted/node_modules ./apps/self-hosted/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules
COPY --from=deps /app/packages/render-helper/node_modules ./packages/render-helper/node_modules
COPY --from=deps /app/packages/wallets/node_modules ./packages/wallets/node_modules

# Copy source code
COPY . .

# Build-time config injection (optional)
# If CONFIG_JSON is provided, it will be used; otherwise, config.template.json is used
ARG CONFIG_JSON=""
RUN if [ -n "$CONFIG_JSON" ]; then \
      echo "$CONFIG_JSON" > apps/self-hosted/config.json; \
    elif [ ! -f apps/self-hosted/config.json ]; then \
      cp apps/self-hosted/config.template.json apps/self-hosted/config.json; \
    fi

# Build shared packages first
RUN pnpm --filter @ecency/sdk build && \
    pnpm --filter @ecency/render-helper build && \
    pnpm --filter @ecency/wallets build

# Build the self-hosted app
RUN pnpm --filter @ecency/self-hosted build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Add labels for container metadata
LABEL org.opencontainers.image.title="Ecency Self-Hosted Blog"
LABEL org.opencontainers.image.description="Self-hosted blog powered by Hive blockchain"
LABEL org.opencontainers.image.source="https://github.com/ecency/vision-next"
LABEL org.opencontainers.image.vendor="Ecency"

# Copy nginx configuration
COPY apps/self-hosted/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/self-hosted/dist /usr/share/nginx/html

# Copy config template for runtime override capability
COPY apps/self-hosted/config.template.json /usr/share/nginx/html/config.template.json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
