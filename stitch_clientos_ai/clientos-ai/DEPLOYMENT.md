# ClientOS — Free Deployment Guide

Deploy ClientOS for **$0/month** with no credit card required.

## Architecture

```
Vercel (Next.js frontend) -> Belmo/Render (NestJS API) -> Supabase (PostgreSQL)
```

## Step 1: Database — Supabase (Free, no credit card)

1. Go to [supabase.com](https://supabase.com) -> Sign up with GitHub
2. Create a new project (Free tier)
3. Wait ~2 min for provisioning
4. Go to **Project Settings -> Database -> Connection string**
5. Copy the connection string (looks like `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`)
6. Replace `[YOUR-PASSWORD]` with your database password
7. Save this string — you'll need it for the API

## Step 2: API — Belmo (Free, no credit card, never sleeps)

1. Go to [belmo.io](https://belmo.io) -> Sign up with GitHub
2. Connect your GitHub repository
3. Select the `apps/api` directory as the root
4. Set these environment variables:
   - `DATABASE_URL` = your Supabase connection string
   - `JWT_SECRET` = run `openssl rand -hex 32` in terminal, paste the output
   - `ENCRYPTION_KEY` = run `openssl rand -hex 16` in terminal, paste the output
   - `CORS_ORIGIN` = `https://your-app.vercel.app` (add after Step 3)
   - `API_PORT` = `3001`
   - `NODE_ENV` = `production`
5. Deploy — Belmo auto-detects Node.js and runs `npm start`
6. Your API will be live at `https://your-app.belmo.io`

### Alternative: Render (Free, sleeps after 15 min)

1. Go to [render.com](https://render.com) -> Sign up with GitHub
2. **New -> Blueprint** -> select this repo
3. Render detects `render.yaml` automatically
4. Set the same environment variables above
5. Deploy

## Step 3: Frontend — Vercel (Free, no credit card)

1. Go to [vercel.com](https://vercel.com) -> Sign up with GitHub
2. **Import Project** -> select your repo
3. Set **Root Directory** to `apps/web`
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-api-url/api` (from Step 2)
5. Deploy — live in ~2 minutes
6. Your app will be at `https://your-app.vercel.app`

## Step 4: Update CORS

Go back to your API hosting (Belmo or Render) and update:
```
CORS_ORIGIN=https://your-app.vercel.app
```
Redeploy the API.

## Step 5: Push Database Schema

Run this locally with your Supabase `DATABASE_URL`:

```bash
export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

This creates all tables in your Supabase database.

## Step 6: Prevent Supabase Pause

Supabase free tier pauses after 7 days of inactivity. Prevent this with a free uptime monitor:

1. Go to [uptimerobot.com](https://uptimerobot.com) -> Sign up (free)
2. Add a monitor -> HTTP(s) -> URL: `https://your-api-url/api/health`
3. Interval: 5 minutes

This keeps your database active 24/7.

## Step 7: Create Your First User

```bash
curl -X POST https://your-api-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPassword123!","firstName":"John","lastName":"Doe","organizationName":"My Agency"}'
```

## Environment Variables Summary

### API (Belmo/Render)
| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `JWT_SECRET` | Random 64-char hex string |
| `ENCRYPTION_KEY` | Random 32-char hex string |
| `CORS_ORIGIN` | Your Vercel frontend URL |
| `API_PORT` | `3001` |
| `NODE_ENV` | `production` |

### Frontend (Vercel)
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api-url/api` |

## Custom Domain (Optional, Free)

1. **Vercel**: Project Settings -> Domains -> Add your domain -> Follow DNS instructions
2. **API**: Update `CORS_ORIGIN` to include your custom domain

## Upgrading When You Get Paying Clients

| Platform | Free -> Paid | What You Get |
|---|---|---|
| Vercel Pro | $20/mo | Commercial use, more bandwidth, team features |
| Belmo Hobby | $19/mo | 3 services, more resources |
| Supabase Pro | $25/mo | 8GB DB, no pause, daily backups |
| **Total** | **$64/mo** | Full production with backups |

## Quick Deploy Checklist

- [ ] Supabase project created, connection string copied
- [ ] API deployed to Belmo/Render with env vars set
- [ ] Frontend deployed to Vercel with NEXT_PUBLIC_API_URL set
- [ ] CORS_ORIGIN updated with frontend URL
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] UptimeRobot monitor set up to prevent Supabase pause
- [ ] First user created via API
