# ClientOS Web — Next.js standalone image (pnpm monorepo)
# Build context must be the monorepo root (stitch_clientos_ai/clientos-ai):
#   docker build -f apps/web/Dockerfile -t ghcr.io/<owner>/clientos-web stitch_clientos_ai/clientos-ai

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.7.1 --activate
WORKDIR /app

# ---- Build ----
FROM base AS build
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# Defaults assume the API is reachable under /api on the same origin (ingress).
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SCRAPER_URL=""
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
ARG NEXT_PUBLIC_CESIUM_ION_TOKEN=""
ENV NEXT_OUTPUT_STANDALONE=true \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SCRAPER_URL=$NEXT_PUBLIC_SCRAPER_URL \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_CESIUM_ION_TOKEN=$NEXT_PUBLIC_CESIUM_ION_TOKEN

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @clientos/web... --frozen-lockfile
RUN pnpm --filter @clientos/web build

# ---- Runtime ----
# Standalone output traces only the files the server needs.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
