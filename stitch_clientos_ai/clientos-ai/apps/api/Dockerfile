# ClientOS API — Dockerfile for production deployment
# Works with Render, Railway, Fly.io, Belmo, and any Docker-compatible host

FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
RUN npm ci --omit=dev || npm install --omit=dev

# ---- Build ----
FROM base AS builder
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./
RUN npm ci
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss && node apps/api/dist/main.js"]
