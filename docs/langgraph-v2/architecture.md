# SafeDeck v2 Architecture: The LLM Engine

## What SafeDeck is

SafeDeck is **an LLM engine that sits between a VC firm and its founders**. The product is the orchestrator itself, not a pipeline.

The engine:
- Receives every email a VC firm gets from founders
- Understands the email's context (pitch deck / reply / follow up / scheduling / irrelevant / question)
- Reasons about the deal state + VC's criteria + public sources
- Decides which actions to take per email
- Tracks state across multiple emails from the same founder
- Continues running, not one-shot

## Why this is different from v1

**v1 (CrewAI)** treated each audit as a one-shot pipeline run. PDF in → 5 agents → DDB. Each email was independent.

**v2 (LangGraph + ReAct agent)** treats each deal as a long-lived conversation:
- Multiple emails from the same founder are linked
- The LLM agent has memory of what it already asked, what was already extracted
- The agent decides what to do based on context, not a fixed pipeline
- Different email types trigger different actions

## The architecture

```
                    ┌────────────────────────────┐
                    │     LLM Agent (Gemini)       │
   [inbox_event] ──> │                            │
                    │  Reasoning:                  │
                    │  - WHO is this from?         │
                    │  - WHAT kind of email?       │
                    │  - WHAT does deal look like? │
                    │  - WHAT should I do?         │
                    │                             │
                    │  Tools (called as needed):   │
                    │   ├─ parse_pdf               │
                    │   ├─ extract_fields          │
                    │   ├─ verify_claim            │
                    │   ├─ send_outreach           │
                    │   ├─ create_meeting          │
                    │   ├─ persist (DDB)           │
                    │   └─ generate_l1_l2          │
                    │                             │
                    │  Context: deal state,        │
                    │           VC's criteria,     │
                    │           email history      │
                    └────────────────────────────┘
```

## How it works on a single email

```python
# Email arrives from a founder
current_email = {
    "from_": "avin@monitra.in",
    "subject": "Pitch deck - Monitra Healthcare",
    "body": "Hi, attached is our pitch deck. Raising $12M Series B.",
    "attachments": [{"path": "s3://...monitra.pdf"}]
}

# The LLM agent receives:
# - System prompt: "You are SafeDeck, the deal orchestrator for AWS Funds..."
# - The current email
# - The current deal state (extracted_fields, missing_fields, etc.)
# - The VC's config (rating criteria, templates)

# The LLM reasons and decides:
# "This is a pitch deck PDF. Existing deal exists (Monitra Healthcare).
#  I should: 1) parse the PDF, 2) extract fields, 3) verify key claims,
#           4) score, 5) persist"

# It calls tools in sequence (or parallel where independent)
```

The LLM is **the orchestrator**. LangGraph is the runtime. State is per-deal. Tools are the actions.

## Deal state

Per-deal state persists across emails:

```python
{
    "deal_id": "deal-monitra-001",
    "tenant_id": "tenant-aws-funds",
    "company_name": "Monitra Healthcare",
    "founder_email": "avin@monitra.in",
    "emails": [...all emails in this deal thread...],
    "extracted_fields": {promoter_name: "Avin Agarwal", ...},
    "missing_fields": [revenue, burn_rate, ...],
    "verifications": {revenue: {source_url: "tracxn.com/...", confidence: "high"}},
    "risk_flags": [...],
    "score": 7.2,
    "l1_note_url": "s3://...L1.docx",
    "l2_note_url": "s3://...L2.docx",
    "pending_actions": [...],
}
```

The LLM has full read access to this state and decides what to update.

## Tools

Each tool is a plain Python function the LLM can call:

| Tool | What it does |
|------|--------------|
| `parse_pdf` | Download PDF from S3, run LlamaParse, return markdown text |
| `extract_fields` | Direct Gemini call: 49 fields from deck + email body |
| `verify_claim` | Serper search for one specific claim, return source + confidence |
| `send_outreach` | Email the founder for missing data, return queued |
| `create_meeting` | Calendly event, return meeting_id + URL |
| `persist` | Write deal state to DynamoDB |
| `generate_l1_l2` | Render L1 + L2 docxtpl notes, upload to S3 |

The LLM picks the right tool(s) per email.

## Why this is the right architecture

**Email understanding**: The LLM reads the email + context and decides. No hardcoded "if subject contains 'pitch' then extract" rules.

**Multi-email continuity**: Same founder sends 5 emails over 3 weeks. The LLM tracks what it already asked, what was already extracted, what verifications ran.

**Heterogeneous email types**: pitch deck, follow-up, reply, scheduling, irrelevant, question. The LLM decides the right action for each.

**Missing field outreach**: If a deck has gaps, the LLM composes a follow-up email asking for specific fields. It doesn't ask for things already known.

**Hermes's role**: The verify_claim tool is what you called "Hermes" — public-source fact-checking per claim. The LLM decides which claims to verify.

## File layout

```
apps/agents/src/safedeck/orchestrator/
  __init__.py         # DealState, AGENT_SYSTEM_PROMPT, make_initial_state
  tools.py            # 7 tool implementations + tool registry
  agent.py            # build_orchestrator(), run_orchestrator_on_email()

apps/agents/src/safedeck/extraction.py  # direct Gemini call (used by extract_fields tool)
```

## Implementation status

- [x] `orchestrator/__init__.py` — DealState, system prompt, factory
- [x] `orchestrator/tools.py` — 7 tool stubs (parse_pdf, extract_fields, etc.)
- [x] `orchestrator/agent.py` — LangGraph ReAct agent with system prompt
- [x] `extraction.py` — direct Gemini call (Phase 1)
- [ ] Wire up real Gmail inbox / SES webhook
- [ ] Real Serper integration in `verify_claim`
- [ ] Real DynamoDB write in `persist`
- [ ] Real Gmail API in `send_outreach`
- [ ] Real Calendly in `create_meeting`
- [ ] Real docxtpl in `generate_l1_l2`
- [ ] Stateful memory across emails (currently single-turn)
- [ ] Per-VC config (rating criteria, templates)

## Migration plan

1. **Stand up the agent** — the 7 tool stubs work, the LLM reasons. This is the "Hello World" of v2.
2. **Wire up real tools** — replace each stub with a real implementation. The LLM still orchestrates; the tools just do the actual work.
3. **Add email ingestion** — Gmail OAuth or SES inbound → trigger the agent.
4. **Add multi-turn memory** — persist deal state across emails so the LLM has continuity.
5. **Test in production** — run v1 and v2 in parallel. Compare output.
6. **Cut over** — when v2 is at parity, switch the audit worker Lambda to call v2.

## Tests

`tests/test_orchestrator.py` covers:
- Tool definitions and registry
- State initialization
- Agent construction
- Tool execution (with stubs)

The agent's reasoning quality is tested manually via `scripts/test_orchestrator_local.py` (run with a real Gemini key + a real email).

## Cost

Per email processed:
- Agent reasoning: 1-3 LLM calls = $0.005-0.02
- Tool calls: depends on what the LLM decides. Most emails need parse + extract (~$0.01). Verification adds ~$0.005 per claim.
- Total per email: **$0.01-0.05**

For 5 VCs × 20 emails/month each = 100 emails/month = **$1-5/month**. Negligible.
