"""
DealState — typed state for the LangGraph orchestrator.

The unit of work is a "deal", not a "pipeline run". A deal has a long
lifecycle (from first email to "funded" or "passed"), and the same
orchestrator handles all the stages: email classification, extraction,
verification, risk analysis, scoring, L1/L2 note generation, etc.

This state object flows through every node in the graph. Nodes read
from it and return partial updates that get merged in.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, Optional
from typing_extensions import TypedDict


# ---------------------------------------------------------------------------
# Sub-types
# ---------------------------------------------------------------------------

DealStage = Literal[
    "new",                # just received an email
    "classifying",         # figuring out what type of email
    "extracting",          # running extraction on a deck
    "verifying",           # cross-checking claims against the web
    "analyzing_risk",      # risk + scoring
    "awaiting_decision",   # VC needs to act (advance/pass)
    "awaiting_info",       # we asked founder for more info
    "info_received",       # founder responded
    "meeting_scheduled",   # Calendly booking
    "meeting_done",        # Fireflies notes received
    "deciding",            # final decision (commit/decline)
    "generating_l1",       # building the L1 note
    "generating_l2",       # building the L2 note
    "funded",              # terminal state
    "passed",              # terminal state
]


class Email(TypedDict):
    """One email in the deal's history."""
    from_: str
    subject: str
    body: str
    received_at: str
    classification: Optional[str]  # "pitch_deck" | "reply" | "follow_up" | "scheduling" | "irrelevant"


class FieldExtraction(TypedDict):
    """One extracted field with provenance."""
    value: str
    source: Literal["deck", "email_body", "vision", "web", "inferred"]
    confidence: Literal["high", "medium", "low"]
    field_key: str


class RiskFlag(TypedDict):
    flag: str
    description: str
    severity: Literal["high", "medium", "low"]


# ---------------------------------------------------------------------------
# State (the thing that flows through the graph)
# ---------------------------------------------------------------------------


class DealState(TypedDict, total=False):
    """The complete state of a deal as it flows through the LangGraph.

    Field-name suffix convention:
        - `_*`         transient input (set at entry, not persisted)
        - `*_history`  list of past values
        - `current_*`  the active value
    """

    # -- Identity --
    deal_id: str
    tenant_id: str
    company_name: str
    stage: DealStage
    stage_history: list[dict]  # [{stage, timestamp, reason}]

    # -- Inputs (set by email trigger) --
    _current_email: Email
    _deck_path: Optional[str]  # S3 path if there's an attached PDF
    _deck_text: Optional[str]  # populated by parser

    # -- Email chain --
    emails: list[Email]  # full history of emails for this deal
    email_classification: Optional[str]

    # -- Extraction outputs --
    extracted_deck_data: dict[str, FieldExtraction]  # 49 fields
    internet_verified_data: dict[str, dict]  # {field: {value, source_url, confidence}}
    missing_fields: list[str]  # fields still "Not stated" after extraction + verification

    # -- Risk + scoring --
    risk_analysis: dict
    scoring: dict
    verification: dict  # truth_score

    # -- Notes + memos --
    l1_note_path: Optional[str]  # S3 path
    l2_note_path: Optional[str]  # S3 path
    l1_template: Optional[str]  # tenant's L1 docx template
    l2_template: Optional[str]  # tenant's L2 docx template

    # -- VC decisions --
    vc_decision: Optional[dict]  # {action: "advance"|"pass"|"decline", notes, decided_at}

    # -- Meetings --
    meeting_id: Optional[str]
    meeting_transcript: Optional[str]

    # -- Outstanding actions --
    pending_actions: Annotated[list[dict], operator.add]  # queued for execution
    completed_actions: list[dict]  # history of executed actions

    # -- Errors / retries --
    errors: list[dict]  # [{node, error, timestamp}]
    retry_count: int

    # -- Audit trail --
    logs: list[dict]  # free-form debug log for the frontend


# ---------------------------------------------------------------------------
# State update helpers
# ---------------------------------------------------------------------------


def make_initial_state(
    *,
    deal_id: str,
    tenant_id: str,
    company_name: str,
    email: dict,
    deck_path: Optional[str] = None,
) -> DealState:
    """Initial state when a new email arrives."""
    return DealState(
        deal_id=deal_id,
        tenant_id=tenant_id,
        company_name=company_name,
        stage="new",
        stage_history=[{"stage": "new", "timestamp": _now(), "reason": "email received"}],
        _current_email=email,
        _deck_path=deck_path,
        emails=[email],
        email_classification=None,
        extracted_deck_data={},
        internet_verified_data={},
        missing_fields=[],
        risk_analysis={},
        scoring={},
        verification={},
        l1_note_path=None,
        l2_note_path=None,
        l1_template=None,
        l2_template=None,
        vc_decision=None,
        meeting_id=None,
        meeting_transcript=None,
        pending_actions=[],
        completed_actions=[],
        errors=[],
        retry_count=0,
        logs=[],
    )


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
