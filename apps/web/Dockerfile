FROM node:20.12 as base

WORKDIR /var/app

# The SENTRY_AUTH_TOKEN is used to upload the source maps to Sentry
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}

ARG NEXT_PUBLIC_GMAPS_API_KEY
ENV NEXT_PUBLIC_GMAPS_API_KEY ${NEXT_PUBLIC_GMAPS_API_KEY}

ARG NEXT_PUBLIC_GMAPS_MAP_ID
ENV NEXT_PUBLIC_GMAPS_MAP_ID ${NEXT_PUBLIC_GMAPS_MAP_ID}

# Pin pnpm to the same version used to create the lockfile
# (set this to whatever you committed in package.json `"packageManager": "pnpm@X.Y.Z"`)

ARG PNPM_VERSION=10.15.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --no-optional

COPY . .

RUN pnpm build

### REMOVE DEV DEPENDENCIES ##
FROM base as dependencies

RUN pnpm install --frozen-lockfile --no-optional --prod

### BUILD MINIFIED PRODUCTION ##
FROM node:20.12 as production

# Add Tini
ENV TINI_VERSION v0.18.0
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]

WORKDIR /var/app

# Activate the same pnpm for runtime "pnpm start"
ARG PNPM_VERSION=10.15.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=dependencies /var/app/package.json /var/app/package.json
COPY --from=dependencies /var/app/healthCheck.js /var/app/healthCheck.js
COPY --from=dependencies /var/app/public /var/app/public
COPY --from=dependencies /var/app/.next /var/app/.next
COPY --from=dependencies /var/app/node_modules /var/app/node_modules

HEALTHCHECK --interval=15s --timeout=5s CMD node /var/app/healthCheck.js

CMD [ "pnpm", "start" ]
