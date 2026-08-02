# SafeDeck — Docker

Two Dockerfiles, one Compose pair for local dev.

## Files

- **`Dockerfile.web`** — multi-stage build for the frontend. Final image is nginx serving the static bundle. Tags: `safedeck-web:dev`, `safedeck-web:prod`.
- **`Dockerfile.audit-worker`** — uses AWS Lambda Python 3.11 base image. Same image deploys as Lambda container (set `PackageType=Image` in SAM) AND runs locally.
- **`docker-compose.yml`** — frontend only. Backend handled by `sam local start-api`.
- **`docker-compose.agents.yml`** — audit worker for local testing.

## Run frontend locally

**Option A: Docker (no Node required):**
```bash
docker build -f docker/Dockerfile.web -t safedeck-web:dev .
docker run -d -p 3000:80 --name safedeck-web safedeck-web:dev
open http://localhost:3000
```

**Option B: docker-compose:**
```bash
docker compose -f docker/docker-compose.yml up --build
open http://localhost:3000
```

**Option C: Vite dev server (with hot reload):**
```bash
cd apps/web
npm install
npm run dev
open http://localhost:3000
```

## Run audit worker locally

```bash
MINIMAX_API_KEY=sk-cp-... LLAMA_CLOUD_API_KEY=llx-... \
  docker compose -f docker/docker-compose.agents.yml up --build
```

The mock SQS event triggers the worker. It will look for an S3 key that doesn't exist locally — that's expected. To trigger a real audit, you need both the SQS queue and the S3 bucket (created via `scripts/bootstrap.sh`).

## Run tests locally

**Python (agents):**
```bash
cd apps/agents
python3 -m venv .venv
source .venv/bin/activate
pip install pytest pydantic pyyaml
PYTHONPATH=src python -m pytest tests/
# 40 passed, 6 skipped (crewai not installed)
```

To run the 6 skipped tests (the ones that need crewai):
```bash
pip install crewai[google-genai,tools]==1.8.1 crewai-tools litellm
PYTHONPATH=src python -m pytest tests/
# 46 passed
```

**JavaScript (frontend):**
```bash
cd apps/web
npm install
npm test
npm run build
```

## Push to ECR

```bash
./scripts/docker-push.sh dev
```

Same `safedeck-web:dev` image you ran locally is now at:
```
${ACCOUNT_ID}.dkr.ecr.eu-north-1.amazonaws.com/safedeck-web:dev
```

## Image size

`safedeck-web:dev` is **77.3 MB** (nginx 1.27-alpine + static bundle). Verified to build and serve the React app at `/`.
