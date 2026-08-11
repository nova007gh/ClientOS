# ClientOS AI

AI-powered client acquisition platform for digital agencies. Find, qualify, and close clients with automated outreach, website audits, and project management.

## Monorepo Structure

```
clientos-ai/
├── apps/
│   ├── api/            # NestJS backend (auth, orgs, prospects, services)
│   ├── web/            # Next.js 14 frontend (App Router, Tailwind, shadcn/ui)
│   ├── ai-service/     # Python FastAPI LLM service (OpenAI, Anthropic)
│   └── worker/         # BullMQ background worker (lead scoring, audits, email)
├── packages/
│   ├── config/         # Shared ESLint & tsconfig
│   ├── database/       # Prisma schema, client, and seed
│   ├── types/          # Shared TypeScript domain types
│   ├── validation/     # Zod validation schemas
│   └── ui/             # Component library (Radix UI, CVA, Tailwind preset)
├── docker-compose.yml  # PostgreSQL, Redis, MinIO
├── turbo.json          # Turborepo task pipeline
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+ (for ai-service)
- Docker (for PostgreSQL, Redis, MinIO)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000`

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. Set up the database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed credentials: `owner@clientos.ai` / `Password123!`

### 5. Start development servers

```bash
pnpm dev
```

This starts all apps in parallel via Turborepo:
- Web: http://localhost:3000
- API: http://localhost:3001
- AI Service: http://localhost:8002
- Worker: background process

## Key Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Prisma Studio |

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Radix UI, Zustand
- **Backend**: NestJS, Prisma, PostgreSQL, JWT auth, Passport
- **AI Service**: Python, FastAPI, OpenAI/Anthropic SDKs
- **Worker**: BullMQ, ioredis, Axios
- **Infrastructure**: Turborepo, pnpm workspaces, Docker
- **Validation**: Zod (shared schemas across frontend and backend)

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/refresh` — Refresh token
- `GET /api/auth/me` — Get current user
- `POST /api/auth/forgot-password` — Request reset
- `POST /api/auth/reset-password` — Reset password

### Organizations
- `GET /api/organizations` — Get org details
- `PATCH /api/organizations` — Update org
- `GET /api/organizations/members` — List members
- `POST /api/organizations/invite` — Invite member
- `PATCH /api/organizations/members/:id` — Update member role
- `DELETE /api/organizations/members/:id` — Remove member

### Onboarding
- `POST /api/onboarding` — Complete onboarding

### Services
- `GET /api/services` — List services
- `POST /api/services` — Create service
- `GET /api/services/:id` — Get service
- `PATCH /api/services/:id` — Update service
- `DELETE /api/services/:id` — Delete service

### Prospects
- `GET /api/prospects` — List (paginated, filterable)
- `POST /api/prospects` — Create
- `GET /api/prospects/:id` — Get
- `PATCH /api/prospects/:id` — Update
- `DELETE /api/prospects/:id` — Delete
- `POST /api/prospects/bulk` — Bulk import

### Health
- `GET /api/health` — API + DB health check

### AI Service
- `POST /v1/completion` — Generic LLM completion
- `POST /v1/lead-score` — Score a prospect
- `POST /v1/email-draft` — Generate cold email
- `POST /v1/audit` — Website audit

## License

Private — © ClientOS AI
