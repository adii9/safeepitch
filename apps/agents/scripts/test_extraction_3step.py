"""
Test script for the 3-step extraction architecture.

This script exists on the fix/extraction-3-step branch and is meant to
validate an extraction approach before deploying it.

Iteration 1: Try the smallest possible extraction scope (9 critical fields)
to see if a focused prompt produces real extraction in the chained pipeline.

Run with:
    cd apps/agents
    PYTHONPATH=src .venv/bin/python scripts/test_extraction_3step.py
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Force env vars BEFORE imports
os.environ.setdefault('AWS_DEFAULT_REGION', 'eu-north-1')
os.environ.setdefault('CREW_MODEL', 'gemini/gemini-3.1-flash-lite-preview')
os.environ.setdefault('EXTRACTION_MODEL', 'gemini/gemini-2.5-flash')

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))


def extract_with_llamaparse(pdf_path: str, api_key: str) -> str:
    """LlamaParse extracts PDF text including from charts/images."""
    from llama_parse import LlamaParse
    parser = LlamaParse(api_key=api_key, result_type='markdown', verbose=False)
    documents = asyncio.run(parser.aload_data(pdf_path))
    return '\n'.join(doc.text for doc in documents)


def run_with_schema(deck_text: str, email_body: str, fields: list, model: str) -> dict:
    """Run the production flow with a custom field schema."""
    from safedeck.flow import SafeDeckFlow

    client_schema = {'kyc': fields, 'financial': [], 'market': []}
    flow = SafeDeckFlow()
    flow.state['inputs'] = {
        'company_name': 'Monitra Healthcare',
        'pitch_deck_content': deck_text,
        'email_body': email_body,
        'dynamic_kyc_fields': '\n'.join([f'- {f["label"]} (JSON key: {f["key"]})' for f in fields]),
        'dynamic_financial_fields': '',
        'dynamic_market_fields': '',
        'rating_criteria': 'Score out of 10.',
    }
    flow.kickoff()
    report = flow.state.get('audit_report', '{}')
    parsed = json.loads(report) if isinstance(report, str) else report
    return parsed.get('extracted_deck_data', {}), parsed.get('scoring', {})


if __name__ == '__main__':
    LLAMA_KEY = os.environ.get('LLAMA_CLOUD_API_KEY')
    GEMINI_KEY = os.environ.get('GEMINI_API_KEY')

    if not LLAMA_KEY or not GEMINI_KEY:
        print('Set LLAMA_CLOUD_API_KEY and GEMINI_API_KEY env vars first')
        sys.exit(1)

    pdf_path = '/Users/adiimathur/Downloads/📦 Misc & Unsorted/Project Titan_IM_2025Dec12 (1) (1).pdf'

    print('=== Step 1: LlamaParse the PDF ===')
    deck_text = extract_with_llamaparse(pdf_path, LLAMA_KEY)
    print(f'Extracted: {len(deck_text)} chars')

    email_body = '''Subject: Pitch Deck - Monitra Healthcare - 24x7 Heart Monitoring
Hi, I'm Avin, founder of Monitra Healthcare. Continuous cardiac monitoring.
$5M raised from Equanimity and Kotak. Looking to raise $12M Series B.
LinkedIn: https://www.linkedin.com/in/avin-agarwal-monitra
Previous exit: Concept Medical (acquired 2021)
Founders: Avin Agarwal (Cornell MBA, ex-Medtronic), Dr. Patel (Carnegie Mellon)
TAM: 24x7 wearable cardiac monitoring - $5B globally by 2028
Rs 12.1 cr FY26 projected revenue (110% CAGR)
'''

    # Iteration 1: 9 critical fields
    test_schemas = [
        ('9 critical fields', [
            {'key': 'company_name', 'label': 'Company Name'},
            {'key': 'promoter_name', 'label': 'Promoter / Founder Name'},
            {'key': 'promoter_linkedin', 'label': 'Promoter LinkedIn URL'},
            {'key': 'amount_raising', 'label': 'Amount Raising'},
            {'key': 'funding_stage', 'label': 'Funding Stage'},
            {'key': 'tam', 'label': 'TAM'},
            {'key': 'sam', 'label': 'SAM'},
            {'key': 'geo_target', 'label': 'Geographic Target'},
            {'key': 'past_exits', 'label': 'Past Exits'},
        ]),
    ]

    for label, fields in test_schemas:
        print(f'\n=== Test: {label} ({len(fields)} fields) ===')
        extracted, scoring = run_with_schema(deck_text, email_body, fields, model='gemini-2.5-flash')
        nonempty = {k: v for k, v in extracted.items() if v and v != 'Not stated'}
        print(f'  extracted: {len(nonempty)}/{len(fields)} non-empty')
        for k, v in nonempty.items():
            print(f'    {k}: {str(v)[:100]}')
        print(f'  score: {scoring.get("score")}')
