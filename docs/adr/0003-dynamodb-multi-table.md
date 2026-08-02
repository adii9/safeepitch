# ADR-0003: Multi-table DynamoDB over single-table design

## Status
Accepted — 2026-08-02

## Context
DynamoDB can be designed two ways:
1. **Single-table design** — all entities in one table, access patterns via sort keys
2. **Multi-table** — one table per entity type

## Decision
**Multi-table.** One table per bounded context.

## Tables
- `SafeDeckUsers` — tenant config, criteria, rating template
- `Deals` — deal records, stage, audit_id, calendly_event_id
- `Audits` — extraction results, truth_score, sources[]
- `Companies` — domain → company_id (1:1 mapping for company identification)
- `Emails` — email thread history, relevance flag
- `Meetings` — calendly + fireflies linked by deal_id
- `Integrations` — OAuth refresh tokens per tenant per provider

## Consequences

### Positive
- Each table has a clear purpose — easy to reason about
- IAM policies per table are straightforward
- No composite sort-key acrobatics
- Cheaper to delete/migrate a single entity type

### Negative
- More tables to manage (7)
- Some cross-table queries require 2 reads (accepted tradeoff)

### Mitigations
- All tables declared in SAM templates (`infra/sam/database/`)
- TTL set on `Emails` (30 days) and `Audits` (configurable per tenant)
- Point-in-time recovery enabled on all tables
