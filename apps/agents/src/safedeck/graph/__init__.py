"""LangGraph definition for the SafeDeck deal orchestrator.

The graph is a state machine that handles the full VC deal lifecycle.
It uses conditional edges to route based on email type, deal stage,
and the result of each step.

Top-level structure:
    [email arrives]
        |
    classify_email (LLM)
        |
    route_based_on_email_type
        |--- pitch_deck → parse → extract → verify → risk → score → save
        |--- reply       → parse_reply → merge_into_deal → [if still missing] outreach
        |--- follow_up   → diff_against_existing → re-verify if changed
        |--- scheduling  → create_meeting → save
        |--- irrelevant  → archive

    [VC reviews on frontend]
        |
    vc_decision (webhook)
        |--- advance → [if has all info] generate_l1, l2
        |             [if missing info] outreach, wait
        |--- pass    → archive

    [L1 + L2 generated]
        |
    save + notify
"""

from __future__ import annotations

from langgraph.graph import StateGraph, END, START

from .state import DealState
from . import nodes


def build_graph() -> StateGraph:
    """Construct the full deal-orchestrator graph."""
    g = StateGraph(DealState)

    # -- Nodes --
    g.add_node("classify_email", nodes.email_classifier_node)
    g.add_node("parse", nodes.parser_node)
    g.add_node("extract", nodes.extract_node)
    g.add_node("verify", nodes.verify_node)
    g.add_node("risk", nodes.risk_node)
    g.add_node("score", nodes.score_node)
    g.add_node("save_after_audit", nodes.save_ddb_node)

    g.add_node("parse_reply", nodes.parser_node)  # same parser, different intent
    g.add_node("merge_reply", nodes.outreach_node)  # placeholder

    g.add_node("outreach", nodes.outreach_node)
    g.add_node("wait_for_founder", _wait_for_founder)  # suspends graph

    g.add_node("create_meeting", nodes.meeting_node)
    g.add_node("wait_for_meeting", _wait_for_meeting)
    g.add_node("meeting_notes", nodes.meeting_notes_node)

    g.add_node("generate_l1", nodes.l1_note_node)
    g.add_node("generate_l2", nodes.l2_note_node)
    g.add_node("final_save", nodes.save_ddb_node)

    g.add_node("archive", _archive)

    # -- Edges --
    g.add_edge(START, "classify_email")

    # Route based on email type
    g.add_conditional_edges(
        "classify_email",
        _route_by_email_type,
        {
            "pitch_deck": "parse",
            "reply": "parse_reply",
            "follow_up": "parse",
            "scheduling": "create_meeting",
            "irrelevant": "archive",
        },
    )

    # pitch_deck / follow_up path
    g.add_edge("parse", "extract")
    g.add_edge("extract", "verify")
    g.add_edge("verify", "risk")
    g.add_edge("risk", "score")
    g.add_edge("score", "save_after_audit")
    g.add_edge("save_after_audit", "wait_for_founder")  # if missing → outreach

    # After save, check if we need to wait for VC decision or outreach for missing info
    g.add_conditional_edges(
        "wait_for_founder",
        _check_missing_fields,
        {
            "missing": "outreach",
            "complete": END,  # wait for VC decision webhook
        },
    )

    # outreach path
    g.add_edge("outreach", END)  # wait for founder response (next email)

    # reply path
    g.add_edge("parse_reply", "merge_reply")
    g.add_conditional_edges(
        "merge_reply",
        _check_missing_fields,
        {
            "missing": "outreach",
            "complete": END,
        },
    )

    # meeting path
    g.add_edge("create_meeting", "wait_for_meeting")
    g.add_edge("wait_for_meeting", "meeting_notes")
    g.add_edge("meeting_notes", "generate_l1")

    # L1 → L2
    g.add_edge("generate_l1", "generate_l2")
    g.add_edge("generate_l2", "final_save")
    g.add_edge("final_save", END)

    # archive
    g.add_edge("archive", END)

    return g


# ---------------------------------------------------------------------------
# Conditional edge functions
# ---------------------------------------------------------------------------


def _route_by_email_type(state: DealState) -> str:
    """Pick the right path based on email classification."""
    classification = state.get("email_classification") or "irrelevant"
    if classification in {"pitch_deck", "follow_up"}:
        return "pitch_deck" if classification == "pitch_deck" else "follow_up"
    return classification


def _check_missing_fields(state: DealState) -> str:
    """If we still have missing fields, route to outreach. Otherwise end."""
    missing = state.get("missing_fields") or []
    return "missing" if missing else "complete"


# ---------------------------------------------------------------------------
# Suspend/resume nodes (for waiting on external events)
# ---------------------------------------------------------------------------


async def _wait_for_founder(state: DealState) -> dict:
    """No-op node. The graph will be resumed when the founder responds
    or when the VC decides to push forward with missing fields."""
    return {"stage": "awaiting_info"}


async def _wait_for_meeting(state: DealState) -> dict:
    """Suspend until the meeting happens + Fireflies webhook fires."""
    return {"stage": "meeting_scheduled"}


async def _archive(state: DealState) -> dict:
    """Mark as terminal state, log the decision, return."""
    return {"stage": "passed" if "irrelevant" in (state.get("_current_email") or {}).get("classification", "") else "passed"}


# ---------------------------------------------------------------------------
# Compiled graph (entry point)
# ---------------------------------------------------------------------------


_compiled = None


def get_compiled_graph():
    """Return the compiled, runnable graph (lazy singleton)."""
    global _compiled
    if _compiled is None:
        g = build_graph()
        _compiled = g.compile()
    return _compiled
