# ADR-0001: SAM over Terraform for infrastructure

## Status
Accepted — 2026-08-02

## Context
Two viable IaC tools for an AWS-only, Lambda-heavy stack:
- **AWS SAM** (CloudFormation underneath)
- **Terraform** (HashiCorp, multi-cloud)

Previous beta iterations of SafeDeck used manually-created AWS resources, leading to drift and unreproducible environments.

## Decision
Use **AWS SAM** as the primary IaC tool.

## Consequences

### Positive
- Native alignment with Lambda + API Gateway + DynamoDB + EventBridge
- One command: `sam build && sam deploy`
- `samconfig.toml` per environment gives reproducible dev/prod
- Built-in `sam local start-api` for local testing

### Negative
- CloudFormation drift debugging is opaque
- Limited to AWS (acceptable — we are AWS-only)

### Mitigations
- Each Lambda gets its own stack (one `template.yaml` per service + root orchestrator)
- `sam validate --lint` in CI to catch template errors
- IaC-only changes — no manual AWS console edits
