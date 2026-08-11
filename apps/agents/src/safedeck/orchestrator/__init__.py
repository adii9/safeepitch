"""
SafeDeck Orchestrator — the LLM engine that sits between VC and founder.

This is an agent, not a pipeline. The same LLM decides what to do
based on incoming emails and the current deal state. There are no
hardcoded "if email is pitch deck then run extraction" rules — the
LLM uses the tools and context to figure it out.

State: one DealState per (VC firm, founder/company). The orchestrator
runs continuously; every email from a founder is an event that the
LLM agent reasons about and acts on.

Tools exposed to the LLM:
  - parse_pdf           : LlamaParse the attached PDF
  - extract_fields      : direct Gemini call to extract 49 fields
  - verify_claim        : Serper search to verify a specific claim
  - send_outreach       : email the founder for missing info
  - create_meeting      : Calendly booking
  - persist             : write to DynamoDB
  - generate_l1_l2      : render L1/L2 notes from templates

The LLM gets:
  - the latest email
  - the deal's full history (emails, extracted data, prior actions)
  - the VC's config (rating criteria, risk tolerance, templates)
  - the public sources for verification

And it returns: a list of tool calls + reasoning. The orchestrator
executes the calls, updates state, and waits for the next email.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, Optional
from typing_extensions import TypedDict
import operator


# ---------------------------------------------------------------------------
# Sub-types
# ---------------------------------------------------------------------------


class Email(TypedDict):
    """One inbound email."""
    id: str
    from_: str
    subject: str
    body: str
    received_at: str
    attachments: list[dict]  # [{path, mime, size}] — paths in S3
    thread_id: Optional[str]  # Gmail thread id (links related emails)


class ClaimVerification(TypedDict):
    """One public-source check on an extracted claim."""
    field_key: str
    claim_value: str
    verified_value: Optional[str]
    source_url: Optional[str]
    confidence: Literal["high", "medium", "low", "not_found"]
    notes: str


class OutreachMessage(TypedDict):
    """A pending or sent email to the founder."""
    to: str
    subject: str
    body: str
    sent_at: Optional[str]
    triggered_by: str  # e.g. "missing_fields"


class DealState(TypedDict, total=False):
    """Per-deal state. Persisted in DynamoDB."""

    # -- Identity --
    deal_id: str
    tenant_id: str  # which VC firm
    company_name: str
    founder_email: str

    # -- Email thread --
    emails: list[Email]  # full history, in order
    current_email: Optional[Email]  # the email we're processing right now

    # -- Extraction (49 fields) --
    extracted_fields: dict[str, dict]  # {key: {value, source, confidence, extracted_from_email_id}}
    missing_fields: list[str]  # fields still "Not stated"

    # -- Verification --
    verifications: dict[str, ClaimVerification]  # {field_key: verification}

    # -- Risk + scoring --
    risk_flags: list[dict]  # [{flag, severity, description, source_claim}]
    score: Optional[float]  # 0-10
    rating_criteria_used: Optional[str]  # which VC's criteria applied

    # -- Meetings --
    meeting_id: Optional[str]
    meeting_transcript: Optional[str]  # Fireflies

    # -- Notes --
    l1_note_url: Optional[str]
    l2_note_url: Optional[str]

    # -- Action queue --
    pending_actions: Annotated[list[dict], operator.add]
    completed_actions: list[dict]

    # -- LLM agent's working memory --
    # What the LLM is currently thinking about. Persisted across emails so
    # the same agent can pick up where it left off when a reply arrives.
    agent_thoughts: list[dict]  # [{email_id, reasoning, planned_actions}]

    # -- Errors --
    errors: list[dict]
    retry_count: int

    # -- Audit --
    logs: list[dict]


# ---------------------------------------------------------------------------
# Agent prompt template — the LLM sees this context
# ---------------------------------------------------------------------------

AGENT_SYSTEM_PROMPT = """You are SafeDeck, the deal orchestrator for {tenant_name}.

Your job: help {tenant_name} (a VC firm) manage inbound emails from founders
about a specific deal. Each email might be a pitch deck, a follow-up with
extra info, a scheduling link, an irrelevant message, or a question.

Your thinking process for every email:
  1. WHO is this from? Is the founder_email known? If yes, link to the deal.
     If no, this is a NEW deal — create one.
  2. WHAT kind of email is this? (pitch_deck / reply / follow_up / scheduling / irrelevant / question)
  3. WHAT does the deal currently look like? (read extracted_fields, missing_fields, verifications)
  4. WHAT should I do? Choose one or more:
       - parse_pdf (if there's an attachment)
       - extract_fields (if a deck is present and not yet extracted)
       - verify_claim (if any extracted claim needs public verification)
       - send_outreach (if there are missing_fields the founder could fill)
       - create_meeting (if the email is scheduling-related)
       - generate_l1_l2 (if extraction+verification is complete and the VC is ready to commit)
       - persist (always — keep the deal state up to date)
  5. WHY? Brief reasoning.

Tool use: prefer parallel tool calls when independent.
Tool use: skip a tool if its precondition isn't met (e.g. don't verify_claim if there's no extracted claim yet).

CRITICAL: Use the proper ReAct tool-call format. Do NOT wrap your response in markdown code fences or JSON. Just:
1. Brief reasoning in plain text
2. Tool calls via the function-calling API (not text)

The system will execute the tool calls and feed results back to you.
"""


def make_initial_state(
    *,
    deal_id: str,
    tenant_id: str,
    founder_email: str,
    company_name: str,
    email: Email,
) -> DealState:
    return DealState(
        deal_id=deal_id,
        tenant_id=tenant_id,
        company_name=company_name,
        founder_email=founder_email,
        emails=[email],
        current_email=email,
        extracted_fields={},
        missing_fields=[],
        verifications={},
        risk_flags=[],
        score=None,
        rating_criteria_used=None,
        meeting_id=None,
        meeting_transcript=None,
        l1_note_url=None,
        l2_note_url=None,
        pending_actions=[],
        completed_actions=[],
        agent_thoughts=[],
        errors=[],
        retry_count=0,
        logs=[],
    )
