#!/usr/bin/env bash
# Bootstrap — creates the AWS resources that SAM stacks depend on but can't
# create themselves (S3 buckets for SAM deploy artifacts, KMS key, etc.)
#
# Run once per environment (dev, prod).
#
# Usage:
#   ./scripts/bootstrap.sh dev
#   ./scripts/bootstrap.sh prod

set -euo pipefail

ENV="${1:-dev}"
REGION="${AWS_REGION:-eu-north-1}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

echo "==> Bootstrapping SafeDeck (${ENV}) in ${REGION} (account ${ACCOUNT_ID})"

# 1. S3 bucket for SAM deployment artifacts
SAM_BUCKET="safedeck-sam-deployments-${ACCOUNT_ID}"
echo "==> Creating S3 bucket: ${SAM_BUCKET}"
aws s3api head-bucket --bucket "${SAM_BUCKET}" 2>/dev/null || \
  aws s3api create-bucket \
    --bucket "${SAM_BUCKET}" \
    --region "${REGION}" \
    --create-bucket-configuration LocationConstraint="${REGION}" \
    --no-cli-pager

# 2. S3 buckets for app data
for bucket in "safedeck-decks-${ENV}" "safedeck-emails-${ENV}" "safedeck-audits-${ENV}"; do
  echo "==> Creating S3 bucket: ${bucket}"
  aws s3api head-bucket --bucket "${bucket}" 2>/dev/null || \
    aws s3api create-bucket \
      --bucket "${bucket}" \
      --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}" \
      --no-cli-pager

  # Enable default encryption
  aws s3api put-bucket-encryption \
    --bucket "${bucket}" \
    --server-side-encryption-configuration '{
      "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }' \
    --no-cli-pager

  # Block public access
  aws s3api put-public-access-block \
    --bucket "${bucket}" \
    --public-access-block-configuration '{
      "BlockPublicAcls": true,
      "IgnorePublicAcls": true,
      "BlockPublicPolicy": true,
      "RestrictPublicBuckets": true
    }' \
    --no-cli-pager
done

# 3. DynamoDB tables (7 — see ADR-0003)
echo "==> Creating DynamoDB tables"
declare -a TABLES=(
  "SafeDeckUsers:tenant_id"
  "Deals:tenant_id"
  "Audits:tenant_id"
  "Companies:tenant_id"
  "Emails:tenant_id"
  "Meetings:tenant_id"
  "Integrations:tenant_id"
)
for table_pk in "${TABLES[@]}"; do
  table="${table_pk%%:*}"
  pk="${table_pk##*:}"
  full="${table}-${ENV}"
  echo "  - ${full} (pk: ${pk})"
  aws dynamodb describe-table --table-name "${full}" --region "${REGION}" 2>/dev/null || \
    aws dynamodb create-table \
      --table-name "${full}" \
      --attribute-definitions "{\"AttributeName\":\"${pk}\",\"AttributeType\":\"S\"}" \
      --key-schema "{\"AttributeName\":\"${pk}\",\"KeyType\":\"HASH\"}" \
      --billing-mode PAY_PER_REQUEST \
      --region "${REGION}" \
      --no-cli-pager
done

# 4. EventBridge bus
echo "==> Creating EventBridge bus: safedeck-events-${ENV}"
aws events describe-event-bus --name "safedeck-events-${ENV}" --region "${REGION}" 2>/dev/null || \
  aws events create-event-bus \
    --name "safedeck-events-${ENV}" \
    --region "${REGION}" \
    --no-cli-pager

# 5. Cognito user pool
echo "==> Creating Cognito User Pool: safedeck-users-${ENV}"
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --region "${REGION}" \
  --query "UserPools[?Name=='safedeck-users-${ENV}'].Id" --output text)
if [ -z "${USER_POOL_ID}" ]; then
  aws cognito-idp create-user-pool \
    --pool-name "safedeck-users-${ENV}" \
    --region "${REGION}" \
    --auto-verified-attributes-updated \
    --no-cli-pager
  echo "  - Pool created. Wire up Google OAuth provider + app client manually."
fi

echo "==> Bootstrap complete for ${ENV}."
echo "    Next: cd infra/sam && sam build && sam deploy --config-env ${ENV}"
