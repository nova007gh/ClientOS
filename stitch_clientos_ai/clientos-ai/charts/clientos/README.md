# clientos Helm chart

Deploys the full ClientOS stack to Kubernetes:

| Component   | Image                              | Port | Notes                    |
|-------------|------------------------------------|------|--------------------------|
| web         | `ghcr.io/<owner>/clientos-web`        | 3000 | Next.js (standalone)     |
| api         | `ghcr.io/<owner>/clientos-api`        | 3001 | NestJS, runs `prisma db push` on start |
| worker      | `ghcr.io/<owner>/clientos-worker`     | —    | BullMQ queue consumer    |
| ai-service  | `ghcr.io/<owner>/clientos-ai-service` | 8002 | FastAPI LLM service      |
| scraper     | `ghcr.io/<owner>/clientos-scraper`    | 8000 | FastAPI scraping service |
| postgres    | `postgres:16-alpine`               | 5432 | Optional, bundled        |
| redis       | `redis:7-alpine`                   | 6379 | Optional, bundled        |

Images are built by `.github/workflows/docker-publish.yml` and pushed to
GitHub Container Registry on every push to `main`.

## Prerequisites

- Kubernetes 1.24+ and Helm 3
- An nginx ingress controller (or set `ingress.enabled=false` and port-forward)
- The app's images published to GHCR (push to `main`, or run the workflow manually)

## Install

```bash
# If GHCR packages are private, create a pull secret first:
kubectl create namespace clientos
kubectl -n clientos create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<PAT-with-read:packages>

helm install clientos ./charts/clientos -n clientos \
  --set global.imagePullSecrets[0].name=ghcr-pull \
  --set image.owner=<ghcr-owner> \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.encryptionKey=$(openssl rand -hex 16) \
  --set secrets.openaiApiKey=<key> \
  --set ingress.host=app.example.com
```

Then point DNS for `app.example.com` at your ingress controller.

## Common overrides

```bash
# Use external Postgres / Redis instead of the bundled ones
--set postgres.enabled=false \
--set secrets.databaseUrl=postgresql://user:pass@host:5432/db \
--set redis.enabled=false \
--set secrets.redisUrl=redis://host:6379

# Pin a specific image tag
--set image.tag=sha-<commit>

# Expose the scraper on its own hostname (its routes share the /api prefix,
# so it cannot share the main host's path routing)
--set ingress.scraperHost=scraper.example.com
```

See `values.yaml` for all options.
