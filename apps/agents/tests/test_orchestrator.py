"""Tests for the v2 orchestrator agent."""

import os
import sys
from pathlib import Path

# Ensure src is on path for direct import
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))

import pytest

# Skip entire module if google-generativeai is not installed
pytest.importorskip("google.generativeai")


def test_state_initialization():
    """make_initial_state produces a valid state for a new email."""
    from safedeck.orchestrator import make_initial_state, DealState

    state = make_initial_state(
        deal_id='deal-001',
        tenant_id='tenant-acme',
        founder_email='founder@testco.com',
        company_name='TestCo',
        email={
            'id': 'email-001',
            'from_': 'founder@testco.com',
            'subject': 'Pitch deck',
            'body': "Here's our deck",
            'received_at': '2026-08-04T12:00:00Z',
            'attachments': [],
            'thread_id': None,
        },
    )

    assert state['deal_id'] == 'deal-001'
    assert state['tenant_id'] == 'tenant-acme'
    assert state['company_name'] == 'TestCo'
    assert state['founder_email'] == 'founder@testco.com'
    assert state['extracted_fields'] == {}
    assert state['missing_fields'] == []
    assert state['pending_actions'] == []
    assert len(state['emails']) == 1


def test_tool_registry():
    """All 7 tools are registered."""
    from safedeck.orchestrator.tools import TOOL_REGISTRY

    expected_tools = {
        'parse_pdf', 'extract_fields', 'verify_claim',
        'send_outreach', 'create_meeting', 'persist', 'generate_l1_l2',
    }
    assert set(TOOL_REGISTRY.keys()) == expected_tools


def test_tool_execution_unknown():
    """Unknown tool name returns error, doesn't crash."""
    from safedeck.orchestrator.tools import execute_tool

    result = execute_tool('not_a_real_tool', {})
    assert 'error' in result


def test_send_outreach_tool():
    """send_outreach returns a queued response."""
    from safedeck.orchestrator.tools import execute_tool

    result = execute_tool('send_outreach', {
        'founder_email': 'founder@testco.com',
        'missing_fields': ['revenue', 'burn_rate'],
        'deal_id': 'deal-001',
    })
    assert result.get('queued') is True
    assert result.get('to') == 'founder@testco.com'
    assert result.get('missing_fields') == ['revenue', 'burn_rate']


def test_create_meeting_tool():
    """create_meeting returns a meeting_id + URL."""
    from safedeck.orchestrator.tools import execute_tool

    result = execute_tool('create_meeting', {
        'founder_email': 'founder@testco.com',
        'deal_id': 'deal-001',
    })
    assert 'meeting_id' in result
    assert 'url' in result


def test_generate_l1_l2_tool():
    """generate_l1_l2 returns S3 URLs."""
    from safedeck.orchestrator.tools import execute_tool

    result = execute_tool('generate_l1_l2', {
        'deal_id': 'deal-001',
        'tenant_id': 'tenant-acme',
        'deal_state': {'extracted_fields': {}},
    })
    assert 'l1_url' in result
    assert 'l2_url' in result
    assert 'deal-001' in result['l1_url']


@pytest.mark.skipif(
    not os.environ.get('GEMINI_API_KEY'),
    reason='GEMINI_API_KEY not set, skipping agent test',
)
def test_agent_builds():
    """The ReAct agent builds successfully when the API key is set."""
    from safedeck.orchestrator.agent import build_orchestrator

    agent, system_prompt = build_orchestrator('AWS Funds')
    assert agent is not None
    assert 'AWS Funds' in system_prompt
