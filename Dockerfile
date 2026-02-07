FROM node:20 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libsqlite3-dev python3 make g++
# Use npm instead of pnpm for native module reliability on this Pi
COPY package.json ./
RUN npm install && find node_modules -name "better_sqlite3.node"
COPY . .
ENV DATABASE_URL=file:/app/data/prod.db
ENV NEXT_PHASE=phase-production-build
RUN mkdir -p /app/data && touch /app/data/prod.db
RUN npm run build

FROM node:20 AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y \
    openssl libsqlite3-dev \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app ./

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
