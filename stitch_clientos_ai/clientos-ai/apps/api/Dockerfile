# ClientOS API — production image (pnpm monorepo)
# Build context must be the monorepo root (stitch_clientos_ai/clientos-ai):
#   docker build -f apps/api/Dockerfile -t ghcr.io/<owner>/clientos-api stitch_clientos_ai/clientos-ai

FROM node:20-slim AS base
# OpenSSL required by Prisma engines
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.7.1 --activate
WORKDIR /app

# ---- Build ----
FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @clientos/api... --frozen-lockfile
RUN pnpm --filter @clientos/database prisma:generate
RUN pnpm --filter @clientos/api build

# ---- Runtime ----
# The workspace layout is copied as-is: dist/main.js is a webpack bundle but the
# Prisma client + engines are resolved from node_modules at runtime.
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3001
# Push the Prisma schema then start (same behaviour as previous Dockerfile/render.yaml)
CMD ["sh", "-c", "pnpm --filter @clientos/database exec prisma db push --accept-data-loss && node apps/api/dist/main.js"]
