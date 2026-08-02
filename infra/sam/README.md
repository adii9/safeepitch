# SafeDeck — SAM Infrastructure

This folder contains the AWS SAM templates for all SafeDeck backend services.

## Structure

Each Lambda lives in its own folder with a `template.yaml`:
- `audit-worker/` — 5 agents + 1 consolidator (the pipeline)
- `upload-api/` — receives PDF uploads
- `dashboard-api/` — reads deals, audits, meetings
- `onboarding-api/` — preferences, criteria, rating
- `company-resolver/` — domain → company_id
- `email-classifier/` — LLM relevance gate
- `meeting-integrations/` — Calendly + Fireflies webhooks
- `ic-memo-generator/` — template + missing fields

The root `template.yaml` orchestrates all of them via nested stacks.

## Local testing

```bash
# Build a single stack
cd audit-worker
sam build

# Run locally with mocked events
sam local start-api
```

## Deploy

```bash
# Plan only (no apply)
sam build && sam deploy --config-env dev --no-execute-changeset

# Deploy to dev
sam build && sam deploy --config-env dev

# Deploy to prod
sam build && sam deploy --config-env prod
```

## Environments

Configured in `samconfig.toml`:
- `dev` → stack-name `safedeck-*-dev`, auto-deploys from `develop` branch
- `prod` → stack-name `safedeck-*-prod`, manual approval from `main` branch

## Required AWS resources

These are deployed by the bootstrap (`scripts/bootstrap.sh`) before any SAM stack:
- S3 bucket for SAM deployment artifacts (`safedeck-sam-deployments`)
- S3 buckets for app data (`safedeck-decks-{env}`, `safedeck-emails-{env}`)
- Cognito User Pool (`safedeck-users-{env}`)
- DynamoDB tables (7 — see ADR-0003)
- EventBridge bus
- SES domain + rule set
- KMS key for encryption

## GitHub Actions

See `.github/workflows/ci.yml`, `deploy-dev.yml`, `deploy-prod.yml`.
