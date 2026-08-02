# SafeDeck

AI deal intelligence layer for VCs. Ingests pitch decks (email-forwarded or uploaded), extracts structured data, fact-checks claims against public sources, and scores the deal against the VC's stated criteria.

> **Status:** Beta development. Not yet released.

---

## Architecture at a glance

See [`docs/architecture.html`](docs/architecture.html) for the full diagram.

- **Frontend:** React + Vite (in `apps/web/`)
- **AI pipeline:** CrewAI 5 agents + 1 consolidator (in `apps/agents/`)
- **Backend:** AWS Lambda + API Gateway + DynamoDB (in `infra/sam/`)
- **Email ingestion:** SES + S3 + EventBridge + n8n (in `workflows/`)
- **Integrations:** Calendly + Fireflies (per-tenant OAuth)

---

## Repo layout

```
safedeck/
├── apps/
│   ├── web/           # React/Vite frontend
│   └── agents/        # CrewAI Python package (name = "safepitch")
├── infra/
│   └── sam/           # SAM templates + Lambda handlers
├── workflows/
│   ├── n8n/           # n8n workflow JSONs
│   └── eventbridge/   # EventBridge rule definitions
├── docs/
│   ├── architecture.html
│   ├── SPEC.md
│   └── adr/           # Architecture Decision Records
├── scripts/
├── .github/workflows/ # CI + CD
└── Makefile
```

---

## Local development

Each sub-app has its own dev workflow. See:
- [`apps/web/README.md`](apps/web/README.md) — frontend
- [`apps/agents/README.md`](apps/agents/README.md) — Python agents
- [`infra/sam/README.md`](infra/sam/README.md) — SAM stacks

---

## Deployment

- `develop` branch → auto-deploys to `dev` environment
- `main` branch → auto-deploys to `prod` after manual approval
- See [`.github/workflows/`](.github/workflows/) for pipeline definitions

---

## ADRs (Architecture Decision Records)

- [ADR-0001: SAM over Terraform](docs/adr/0001-sam-over-terraform.md)
- [ADR-0002: Repo layout](docs/adr/0002-repo-layout.md)
- [ADR-0003: Multi-table DynamoDB](docs/adr/0003-dynamodb-multi-table.md)
