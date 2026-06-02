# Ecency Hosting API - Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Toolchain for node-gyp: a transitive native dep (better-sqlite3) ships no
# Node 24 musl prebuild, so npm compiles it from source and alpine needs
# python3 + make + g++. Only the builder needs these; the runtime stage copies
# the already-compiled node_modules.
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:24-alpine

WORKDIR /app

# Copy source and dependencies (tsx runs TypeScript directly)
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create configs directory
RUN mkdir -p /app/configs

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV CONFIG_DIR=/app/configs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]
