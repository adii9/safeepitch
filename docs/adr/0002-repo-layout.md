# ADR-0002: Monorepo layout — apps / infra / workflows / docs

## Status
Accepted — 2026-08-02

## Context
We need a single source of truth for:
- Frontend code (React/Vite)
- Backend agents (Python / CrewAI)
- AWS infrastructure (SAM templates)
- n8n workflows (JSON)
- EventBridge rules (SAM-managed)
- Documentation
- CI/CD

Previous layout had separate sibling folders (`craftflow-frontend/`, `safepitch/`, `Pitchsafe Landing Page/`) which led to confusion about "what is the actual repo".

## Decision
**One monorepo.** Apps separated by runtime, infra separated by tooling, everything version-controlled together.

## Layout
```
safedeck/
├── apps/
│   ├── web/          # React/Vite frontend
│   └── agents/       # Python (CrewAI), package name = "safepitch"
├── infra/
│   └── sam/          # SAM templates + Lambda handlers
├── workflows/
│   ├── n8n/          # n8n workflow JSONs
│   └── eventbridge/  # EventBridge rule definitions
├── docs/
│   ├── architecture.html
│   ├── SPEC.md
│   └── adr/          # this folder
├── scripts/
├── .github/workflows/
└── Makefile
```

## Consequences
- Single PR can change frontend + backend + infra
- CI is per-app (parallel jobs)
- Cleanup is trivial (one repo to delete)
- Future: tools like `nx` or `turborepo` can be added if needed
