# SafeDeck — Product Specification (Beta)

> **Status:** Active beta development
> **Last Updated:** 2026-08-02

## 1. What SafeDeck Does

AI deal intelligence layer for VCs. Sits between inbound pitch decks and a VC's deal workflow. (Internal codename: `safeepitch` — external brand is SafeDeck.)

**Core loop:**
1. Founder emails a pitch deck PDF to `{slug}@safedeck.ai` (or manual upload)
2. Email ingestion (SES + S3 + EventBridge + n8n) extracts the PDF
3. Email Classifier Lambda decides: relevant to a deal, or noise
4. If relevant → SQS → Audit Worker Lambda (5 agents + 1 consolidator)
5. LlamaParse → extraction_specialist → osint_investigator → risk_analyst → ic_scoring_agent → claim_truth_scorer → final_consolidation_task
6. Result written to DynamoDB (`Audits` table) + EventBridge fan-out
7. Frontend dashboards show: all deals (Kanban), deal detail (extraction + fact-check + meetings), IC memo generator

## 2. Architecture (beta)

Single-region AWS eu-north-1. Multi-tenant via Cognito + DynamoDB.

See `docs/architecture.html` for the diagram.

## 3. Agents (5 + 1)

All run on `minimax/MiniMax-M2.7`.

1. **extraction_specialist** — tenant-defined fields (criteria)
2. **osint_investigator** — public info fact-check (with sources[])
3. **risk_analyst** — red/green flags
4. **ic_scoring_agent** — rating criteria scoring
5. **claim_truth_scorer** — deterministic truth_score
6. **final_consolidation_task** — merged JSON (uses market_intelligence_analyst agent)

## 4. DynamoDB Tables

- `SafeDeckUsers` — tenant config
- `Deals` — deal records + stage
- `Audits` — extraction results
- `Companies` — domain → company_id
- `Emails` — thread history + relevance
- `Meetings` — calendly + fireflies
- `Integrations` — OAuth tokens per tenant

## 5. Integrations

- **Calendly** — OAuth per-VC, webhooks for meeting events
- **Fireflies** — webhooks for meeting transcripts
- **Google Sheets** — EventBridge-driven write-back
- **Slack** — EventBridge-driven notifications

## 6. Out of scope (beta)

- Microsoft ecosystem (Outlook, Excel)
- Portfolio monitoring (founder updates, runway tracking)
- Continuous deal monitoring (re-audit on CEO change)
- LinkedIn founder tracking
- Real-time competitive analysis
- Tracxn API integration (using SerperDevTool proxy)
