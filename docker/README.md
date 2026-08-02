# SafeDeck Docker

Two Dockerfiles, one Compose for convenience.

## Files

- **`Dockerfile.web`** — multi-stage build for the frontend. Final image is nginx serving the static bundle. Tags: `safedeck-web:dev`, `safedeck-web:prod`.
- **`Dockerfile.audit-worker`** — uses AWS Lambda Python 3.11 base image. Same image deploys as Lambda container (set `PackageType=Image` in SAM) AND runs locally.
- **`docker-compose.yml`** — frontend only. Backend handled by `sam local start-api`.
- **`docker-compose.agents.yml`** — audit worker for local testing.

## Run locally

Frontend:
```bash
docker compose -f docker/docker-compose.yml up --build
open http://localhost:3000
```

Audit worker (with mock SQS event):
```bash
MINIMAX_API_KEY=sk-cp-... LLAMA_CLOUD_API_KEY=llx-... \
  docker compose -f docker/docker-compose.agents.yml up --build
```

## Push to ECR

```bash
./scripts/docker-push.sh dev
```

The same `safedeck-web:dev` image you ran locally is now at:
```
${ACCOUNT_ID}.dkr.ecr.eu-north-1.amazonaws.com/safedeck-web:dev
```
