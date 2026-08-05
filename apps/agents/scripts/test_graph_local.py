"""Manually run the LangGraph deal orchestrator on a real PDF.

Usage:
    cd apps/agents
    PYTHONPATH=src .venv/bin/python scripts/test_graph_local.py
"""

import os
import sys
import json
import asyncio
from pathlib import Path

os.environ.setdefault('AWS_DEFAULT_REGION', 'eu-north-1')
os.environ.setdefault('CREW_MODEL', 'gemini/gemini-3.1-flash-lite-preview')
os.environ.setdefault('EXTRACTION_MODEL', 'gemini/gemini-2.5-flash')

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))


def main():
    from safedeck.graph import get_compiled_graph
    from safedeck.graph.state import make_initial_state

    pdf_path = '/Users/adiimathur/Downloads/📦 Misc & Unsorted/Project Titan_IM_2025Dec12 (1) (1).pdf'

    # Build initial state (simulating email arrival)
    state = make_initial_state(
        deal_id='deal-monitra-001',
        tenant_id='tenant-default',
        company_name='Monitra Healthcare',
        email={
            'from_': 'avin@monitra.in',
            'subject': 'Pitch deck - Monitra Healthcare',
            'body': 'Subject: Pitch Deck for Monitra. Avin Agarwal founder. $5M raised. $12M Series B. Concept Medical exit. $5B TAM.',
            'received_at': '2026-08-04T12:00:00Z',
            'classification': 'pitch_deck',
        },
        deck_path=pdf_path,
    )
    # Pre-classify since the email classifier isn't implemented yet
    state['email_classification'] = 'pitch_deck'

    print('=== Initial state ===')
    print(f'  deal_id: {state["deal_id"]}')
    print(f'  stage: {state["stage"]}')
    print(f'  email classification: {state["email_classification"]}')

    print('\n=== Compiling graph ===')
    graph = get_compiled_graph()
    print(f'  nodes: {len(graph.nodes)}')
    print(f'  node names: {sorted(graph.nodes.keys())}')

    # We can't fully run the graph because most nodes are NotImplementedError
    # stubs. But we can verify the structure.
    print('\n=== Graph structure (BEFORE node implementations) ===')
    print('  ✓ classify_email: routes based on email type')
    print('  ✓ parse: LlamaParse the PDF')
    print('  ✗ extract: direct Gemini call (NotImplementedError)')
    print('  ✗ verify: Serper per field (NotImplementedError)')
    print('  ✗ risk, score: Gemini reasoning (NotImplementedError)')
    print('  ✗ save_after_audit: DDB write (NotImplementedError)')
    print('  ✗ outreach, meeting, l1_note, l2_note: not started yet')

    # Visualize
    print('\n=== Graphviz (if available) ===')
    try:
        from IPython.display import Image
        img_data = graph.get_graph().draw_mermaid_png()
        out_path = '/tmp/safedeck-graph.png'
        with open(out_path, 'wb') as f:
            f.write(img_data)
        print(f'  Saved to {out_path}')
    except ImportError:
        print('  IPython not available, skipping visualization')

    print('\n=== Mermaid diagram source ===')
    try:
        print(graph.get_graph().draw_mermaid())
    except Exception as e:
        print(f'  Mermaid render failed: {e}')


if __name__ == '__main__':
    main()
