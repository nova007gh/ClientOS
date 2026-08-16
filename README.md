# ClientOS

ClientOS is an AI-powered client and sales management platform for agencies. It includes dashboards, CRM, campaigns, proposals, contracts, a lead map, and an AI copilot.

## Repositories

- `stitch_clientos_ai/clientos-ai` — main monorepo (Next.js web + NestJS API)
- `docs/user-manual.html` — end-user documentation

## Local setup

```bash
cd stitch_clientos_ai/clientos-ai
pnpm install
pnpm turbo dev
```

Web runs on http://localhost:3005, API on http://localhost:3001 by default.

## Deployment

- **Web (Next.js)**: `stitch_clientos_ai/clientos-ai/apps/web`
- **API (NestJS)**: `stitch_clientos_ai/clientos-ai/apps/api`

See `stitch_clientos_ai/clientos-ai/DEPLOYMENT.md` for full deployment instructions.
