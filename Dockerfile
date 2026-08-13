ARG NODE_VERSION=20
ARG PNPM_VERSION=10.28.2

FROM node:${NODE_VERSION}-bookworm-slim AS builder
ARG PNPM_VERSION

WORKDIR /app

# Marta uses the system Chromium package in production. Prevent Puppeteer from
# downloading a second browser while installing the build dependencies.
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV DATABASE_URL=file:/app/data/prod.db
ENV NEXT_PHASE=phase-production-build

RUN mkdir -p /app/data \
    && touch /app/data/prod.db \
    && pnpm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner

LABEL org.opencontainers.image.title="martas-health-lab" \
      com.martas-health-lab.managed="true"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        fonts-dejavu-core \
        libxss1 \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs \
    && mkdir -p /app/data /app/scripts \
    && chown -R nextjs:nodejs /app

# Next standalone output contains only traced production dependencies. The
# database upgrade script remains an explicit startup prerequisite.
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/scripts/db-upgrade.js ./scripts/db-upgrade.js

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node scripts/db-upgrade.js && exec node server.js"]
