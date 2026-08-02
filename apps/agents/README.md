# SafeDeck Agents (Python package: `safepitch`)

CrewAI pipeline for pitch deck analysis. 5 agents + 1 consolidator.

## Setup

```bash
# Install
uv sync

# Set environment
cp .env.example .env
# Edit .env with MINIMAX_API_KEY, etc.

# Run locally
uv run safepitch

# Test
uv run pytest
```

## Pipeline

1. **extraction_specialist** — extracts tenant-defined fields from the deck
2. **osint_investigator** — fact-checks public info (with sources[])
3. **risk_analyst** — flags red/green
4. **ic_scoring_agent** — applies rating criteria
5. **claim_truth_scorer** — deterministic truth_score
6. **final_consolidation_task** — merges everything

## Module structure

```
src/safedeck/
├── agents/        # agent definitions (one file per agent)
├── tasks/         # task definitions (one file per task)
├── models.py      # Pydantic models
├── crew.py        # CrewAI assembly
├── flow.py        # CrewAI Flow (state persistence)
└── config/        # YAML configs for agents + tasks
```

## Importing from Lambda handlers

The handler in `infra/sam/audit-worker/handler.py` imports from here:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[3] / "apps" / "agents" / "src"))
from safedeck.flow import kickoff_audit
```

For deployment, this folder is bundled into the Lambda deployment package.
