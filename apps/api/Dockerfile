FROM node:22-bookworm-slim AS base
# openssl + ca-certificates must be present when `prisma generate` runs so the
# correct debian-openssl-3.0.x engine is generated for this (bookworm) platform.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9.14.4

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
RUN pnpm --filter @prospex/database exec prisma generate
RUN pnpm --filter @prospex/api build

# Runtime: same glibc base as the builder so the Prisma engine generated above
# matches the runtime platform (no runtime download / permission errors).
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN npm install -g pnpm@9.14.4

# Chromium system deps + openssl (required by Prisma on Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libdbus-1-3 libxkbcommon0 libx11-6 libxcomposite1 \
    libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libxshmfence1 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install Playwright Chromium to a shared path the non-root user can read
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN pnpm --filter @prospex/api exec playwright install chromium

RUN addgroup --system prospex && adduser --system --ingroup prospex prospex \
    && chmod -R a+rX /ms-playwright
USER prospex

WORKDIR /app/apps/api
CMD ["node", "dist/main"]
