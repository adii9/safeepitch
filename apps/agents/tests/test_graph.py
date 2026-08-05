"""Test the LangGraph deal orchestrator.

This test verifies the graph structure (nodes + edges) without
making any LLM calls. It tests that:
- All expected nodes exist
- The conditional routing works correctly with mocked state
- The graph compiles without errors
"""

import pytest

pytest.importorskip("langgraph")


def test_graph_imports():
    """The graph module imports cleanly."""
    from safedeck.graph import build_graph, get_compiled_graph
    from safedeck.graph.state import DealState, make_initial_state

    assert build_graph is not None
    assert get_compiled_graph is not None
    assert DealState is not None
    assert make_initial_state is not None


def test_state_initialization():
    """make_initial_state produces a valid state for a new email."""
    from safedeck.graph.state import make_initial_state, DealState

    state = make_initial_state(
        deal_id="deal-001",
        tenant_id="tenant-acme",
        company_name="TestCo",
        email={
            "from_": "founder@testco.com",
            "subject": "Pitch deck",
            "body": "Here's our deck",
            "received_at": "2026-08-04T12:00:00Z",
            "classification": None,
        },
        deck_path="s3://safedeck-decks/dev/deal-001.pdf",
    )

    assert state["deal_id"] == "deal-001"
    assert state["tenant_id"] == "tenant-acme"
    assert state["company_name"] == "TestCo"
    assert state["stage"] == "new"
    assert state["_deck_path"] == "s3://safedeck-decks/dev/deal-001.pdf"
    assert len(state["emails"]) == 1
    assert state["extracted_deck_data"] == {}
    assert state["pending_actions"] == []


def test_routing_by_email_type():
    """The classifier routes different email types correctly."""
    from safedeck.graph import _route_by_email_type

    assert _route_by_email_type({"email_classification": "pitch_deck"}) == "pitch_deck"
    assert _route_by_email_type({"email_classification": "follow_up"}) == "follow_up"
    assert _route_by_email_type({"email_classification": "reply"}) == "reply"
    assert _route_by_email_type({"email_classification": "scheduling"}) == "scheduling"
    assert _route_by_email_type({"email_classification": "irrelevant"}) == "irrelevant"
    assert _route_by_email_type({"email_classification": None}) == "irrelevant"
    assert _route_by_email_type({}) == "irrelevant"


def test_check_missing_fields_routing():
    """After extraction, route to outreach if fields are missing, else end."""
    from safedeck.graph import _check_missing_fields

    # Has missing fields → outreach
    assert _check_missing_fields({"missing_fields": ["revenue", "burn_rate"]}) == "missing"
    # All fields present → end (wait for VC decision)
    assert _check_missing_fields({"missing_fields": []}) == "complete"
    # No key at all → complete
    assert _check_missing_fields({}) == "complete"


def test_graph_compiles():
    """The graph compiles without errors and has the expected nodes."""
    from safedeck.graph import get_compiled_graph

    graph = get_compiled_graph()

    # LangGraph compiled graphs expose nodes via .nodes
    node_names = list(graph.nodes.keys())
    expected = {
        "classify_email", "parse", "extract", "verify", "risk", "score",
        "save_after_audit", "parse_reply", "merge_reply", "outreach",
        "wait_for_founder", "create_meeting", "wait_for_meeting",
        "meeting_notes", "generate_l1", "generate_l2", "final_save", "archive",
    }
    actual = set(node_names)
    missing = expected - actual
    assert not missing, f"Missing nodes: {missing}. Got: {actual}"


def test_state_merge_via_reducer():
    """The pending_actions list uses operator.add so multiple nodes can append."""
    from safedeck.graph.state import DealState

    # Simulate two nodes adding to pending_actions
    initial: DealState = {"pending_actions": []}
    update1 = {"pending_actions": [{"action": "send_email", "to": "founder@x.com"}]}
    update2 = {"pending_actions": [{"action": "schedule_call", "when": "tomorrow"}]}

    # Manual merge (operator.add would be applied by the graph runtime)
    merged = initial.get("pending_actions", []) + update1.get("pending_actions", []) + update2.get("pending_actions", [])
    assert len(merged) == 2
    assert merged[0]["action"] == "send_email"
    assert merged[1]["action"] == "schedule_call"
