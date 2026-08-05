"""LangGraph nodes for the SafeDeck deal orchestrator.

Each node is a pure function: (state) -> state_update. Nodes never
mutate the input state directly. They return a dict that the graph
merges in.

This keeps every step:
- Idempotent (safe to retry)
- Testable in isolation
- Debuggable (we can log every node's input + output)
"""

from .state import DealState, Email
from typing import Any


# Placeholder for the actual node implementations. These get filled in
# as we migrate from CrewAI to LangGraph node-by-node.

async def email_classifier_node(state: DealState) -> dict:
    """Decide what kind of email this is."""
    raise NotImplementedError


async def parser_node(state: DealState) -> dict:
    """Run LlamaParse on the PDF attachment."""
    raise NotImplementedError


async def extract_node(state: DealState) -> dict:
    """Direct Gemini call to extract 49 fields from the deck."""
    raise NotImplementedError


async def verify_node(state: DealState) -> dict:
    """For each non-pitch_deck field, search Serper for verification."""
    raise NotImplementedError


async def risk_node(state: DealState) -> dict:
    """CrewAI agent for risk analysis (or direct Gemini call in v2)."""
    raise NotImplementedError


async def score_node(state: DealState) -> dict:
    """Apply VC's rating criteria → numerical score."""
    raise NotImplementedError


async def outreach_node(state: DealState) -> dict:
    """If missing fields, send founder a follow-up email asking for them."""
    raise NotImplementedError


async def meeting_node(state: DealState) -> dict:
    """Create a Calendly event when VC decides to advance."""
    raise NotImplementedError


async def meeting_notes_node(state: DealState) -> dict:
    """Receive Fireflies webhook transcript and merge into deal state."""
    raise NotImplementedError


async def decision_node(state: DealState) -> dict:
    """Wait for VC's final decision. Triggered by frontend webhook."""
    raise NotImplementedError


async def l1_note_node(state: DealState) -> dict:
    """Generate L1 note (initial commitment) using tenant's template."""
    raise NotImplementedError


async def l2_note_node(state: DealState) -> dict:
    """Generate L2 note (standard term sheet) using tenant's template."""
    raise NotImplementedError


async def save_ddb_node(state: DealState) -> dict:
    """Persist the full deal state to DynamoDB."""
    raise NotImplementedError
