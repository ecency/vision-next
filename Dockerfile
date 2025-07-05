FROM node:20.12 as base

WORKDIR /var/app

# The SENTRY_AUTH_TOKEN is used to upload the source maps to Sentry
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}

ARG NEXT_PUBLIC_GMAPS_API_KEY
ENV NEXT_PUBLIC_GMAPS_API_KEY ${NEXT_PUBLIC_GMAPS_API_KEY}

ARG NEXT_PUBLIC_GMAPS_MAP_ID
ENV NEXT_PUBLIC_GMAPS_MAP_ID ${NEXT_PUBLIC_GMAPS_MAP_ID}

COPY package.json yarn.lock ./

RUN yarn install --non-interactive --frozen-lockfile --ignore-optional

COPY . .

RUN yarn build

### REMOVE DEV DEPENDENCIES ##
FROM base as dependencies

RUN yarn install --non-interactive --frozen-lockfile --ignore-optional --production

### BUILD MINIFIED PRODUCTION ##
FROM node:20.12 as production

# Add Tini
ENV TINI_VERSION v0.18.0
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]

WORKDIR /var/app

COPY --from=dependencies /var/app/package.json /var/app/package.json
COPY --from=dependencies /var/app/healthCheck.js /var/app/healthCheck.js
COPY --from=dependencies /var/app/public /var/app/public
COPY --from=dependencies /var/app/.next /var/app/.next
COPY --from=dependencies /var/app/node_modules /var/app/node_modules

HEALTHCHECK --interval=15s --timeout=5s CMD node /var/app/healthCheck.js

CMD [ "yarn", "start" ]
