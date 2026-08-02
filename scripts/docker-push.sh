#!/usr/bin/env bash
# Build and push all SafeDeck Docker images to ECR.
#
# Usage:
#   ./scripts/docker-push.sh dev
#   ./scripts/docker-push.sh prod
#
# Tags:
#   - safedeck-web:dev → for local use and dev deploy
#   - same images can be pushed to ECR for Lambda container deployment

set -euo pipefail

ENV="${1:-dev}"
REGION="${AWS_REGION:-eu-north-1}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> Build + push for env=${ENV} region=${REGION}"

# 1. Ensure ECR auth
echo "==> Logging into ECR"
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ECR_BASE}"

# 2. Create ECR repos if they don't exist
for repo in "safedeck-web" "safedeck-audit-worker"; do
  echo "==> Ensuring ECR repo: ${repo}"
  aws ecr describe-repositories --repository-names "${repo}" --region "${REGION}" 2>/dev/null || \
    aws ecr create-repository \
      --repository-name "${repo}" \
      --region "${REGION}" \
      --no-cli-pager
done

# 3. Build + tag + push web (local + ECR)
echo "==> Building web image"
cd "$(dirname "${BASH_SOURCE[0]}")/../apps/web"
docker build -t "safedeck-web:${ENV}" -f ../../docker/Dockerfile.web .
docker tag "safedeck-web:${ENV}" "${ECR_BASE}/safedeck-web:${ENV}"
docker push "${ECR_BASE}/safedeck-web:${ENV}"

# 4. Build + tag + push audit worker (Lambda container image)
echo "==> Building audit worker image"
cd "$(dirname "${BASH_SOURCE[0]}")/.."
docker build -t "safedeck-audit-worker:${ENV}" -f docker/Dockerfile.audit-worker .
docker tag "safedeck-audit-worker:${ENV}" "${ECR_BASE}/safedeck-audit-worker:${ENV}"
docker push "${ECR_BASE}/safedeck-audit-worker:${ENV}"

echo "==> Done. Images:"
echo "    ${ECR_BASE}/safedeck-web:${ENV}"
echo "    ${ECR_BASE}/safedeck-audit-worker:${ENV}"

# 5. Local run for landing + frontend
echo ""
echo "==> To run locally:"
echo "    docker run -d -p 3000:3000 --name safedeck-web safedeck-web:${ENV}"
echo "    open http://localhost:3000"
