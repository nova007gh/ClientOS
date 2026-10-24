# ClientOS Worker — BullMQ queue processor (pnpm monorepo)
# Build context must be the monorepo root (stitch_clientos_ai/clientos-ai):
#   docker build -f apps/worker/Dockerfile -t ghcr.io/<owner>/clientos-worker stitch_clientos_ai/clientos-ai

FROM node:20-slim AS base
# OpenSSL required by Prisma engines
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.7.1 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
# Install before setting NODE_ENV=production so devDeps (tsx) are present —
# the worker consumes @clientos/database's TypeScript source via tsx at runtime.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @clientos/worker... --frozen-lockfile
RUN pnpm --filter @clientos/database prisma:generate

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@clientos/worker", "exec", "tsx", "src/index.ts"]
