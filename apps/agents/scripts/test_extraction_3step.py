"""
Test script for extraction on the chained pipeline.

Iterations:
- v1 (40-field): full production schema, LlamaParse'd deck
- v2 (40-field): same schema, but chunked deck (first 8 KB only)
- v3 (49-field): full schema, chunked deck

Run:
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
    from llama_parse import LlamaParse
    parser = LlamaParse(api_key=api_key, result_type='markdown', verbose=False)
    documents = asyncio.run(parser.aload_data(pdf_path))
    return '\n'.join(doc.text for doc in documents)


def run_full_pipeline(deck_text: str, email_body: str, fields: list) -> dict:
    """Run the full chained agent pipeline (5 agents)."""
    from safedeck.flow import SafeDeckFlow

    # Convert fields list into the evaluation_criteria dict the flow expects
    field_keys = [f['key'] for f in fields if f['key'] != 'company_name']
    evaluation_criteria = {
        'must_have': [k for k in field_keys if k in {'promoter_name', 'founder_background', 'past_exits'}],
        'nice_to_have': [k for k in field_keys if k not in {'promoter_name', 'founder_background', 'past_exits'}],
    }

    flow = SafeDeckFlow()
    flow.state['inputs'] = {
        'company_name': 'Monitra Healthcare',
        'pitch_deck_content': deck_text,
        'email_body': email_body,
        'dynamic_kyc_fields': '\n'.join([f'- {f["label"]} (JSON key: {f["key"]})' for f in fields]),
        'dynamic_financial_fields': '',
        'dynamic_market_fields': '',
        'rating_criteria': 'Score out of 10.',
        'evaluation_criteria': evaluation_criteria,
    }
    flow.kickoff()
    report = flow.state.get('audit_report', '{}')
    parsed = json.loads(report) if isinstance(report, str) else report
    return {
        'extracted_deck_data': parsed.get('extracted_deck_data', {}),
        'internet_verified_data': parsed.get('internet_verified_data', {}),
        'scoring': parsed.get('scoring', {}),
        'verification': parsed.get('verification', {}),
        'risk_analysis': parsed.get('risk_analysis', {}),
    }


# Production's full schema (49 fields, condensed)
PRODUCTION_SCHEMA = [
    {'key': 'company_name', 'label': 'Company Name'},
    {'key': 'promoter_name', 'label': 'Promoter Name'},
    {'key': 'promoter_linkedin', 'label': 'Promoter LinkedIn'},
    {'key': 'founder_background', 'label': 'Founder Background'},
    {'key': 'past_exits', 'label': 'Past Exits'},
    {'key': 'two_x_founder_flag', 'label': 'Two X Founder Flag'},
    {'key': 'founder_age', 'label': 'Founder Age'},
    {'key': 'founder_tenure', 'label': 'Founder Tenure'},
    {'key': 'founder_education', 'label': 'Founder Education'},
    {'key': 'tam', 'label': 'TAM'},
    {'key': 'sam', 'label': 'SAM'},
    {'key': 'som', 'label': 'SOM'},
    {'key': 'problem_size', 'label': 'Problem Size'},
    {'key': 'market_growth_rate', 'label': 'Market Growth Rate'},
    {'key': 'market_evidence', 'label': 'Market Evidence'},
    {'key': 'geo_target', 'label': 'Geo Target'},
    {'key': 'regulatory_tailwinds', 'label': 'Regulatory Tailwinds'},
    {'key': 'revenue', 'label': 'Revenue'},
    {'key': 'revenue_growth_rate', 'label': 'Revenue Growth Rate'},
    {'key': 'unit_economics', 'label': 'Unit Economics'},
    {'key': 'burn_rate', 'label': 'Burn Rate'},
    {'key': 'runway', 'label': 'Runway'},
    {'key': 'customer_count', 'label': 'Customer Count'},
    {'key': 'customer_concentration', 'label': 'Customer Concentration'},
    {'key': 'churn_rate', 'label': 'Churn Rate'},
    {'key': 'net_retention', 'label': 'Net Retention'},
    {'key': 'annual_contract_value', 'label': 'Annual Contract Value'},
    {'key': 'annual_recurring_revenue', 'label': 'Annual Recurring Revenue'},
    {'key': 'mrr_growth', 'label': 'MRR Growth'},
    {'key': 'gross_margin', 'label': 'Gross Margin'},
    {'key': 'competitors_listed', 'label': 'Competitors Listed'},
    {'key': 'competitive_landscape', 'label': 'Competitive Landscape'},
    {'key': 'moat', 'label': 'Moat'},
    {'key': 'ip_patents', 'label': 'IP Patents'},
    {'key': 'switching_cost', 'label': 'Switching Cost'},
    {'key': 'market_share', 'label': 'Market Share'},
    {'key': 'current_round', 'label': 'Current Round'},
    {'key': 'funding_stage', 'label': 'Funding Stage'},
    {'key': 'amount_raising', 'label': 'Amount Raising'},
    {'key': 'pre_money_valuation', 'label': 'Pre-Money Valuation'},
    {'key': 'post_money_valuation', 'label': 'Post-Money Valuation'},
    {'key': 'cap_table', 'label': 'Cap Table'},
    {'key': 'prior_investors', 'label': 'Prior Investors'},
    {'key': 'use_of_funds', 'label': 'Use Of Funds'},
    {'key': 'dilution', 'label': 'Dilution'},
    {'key': 'investment_multiple', 'label': 'Investment Multiple'},
    {'key': 'option_pool', 'label': 'Option Pool'},
    {'key': 'product_stage', 'label': 'Product Stage'},
    {'key': 'product_differentiation', 'label': 'Product Differentiation'},
    {'key': 'tech_stack', 'label': 'Tech Stack'},
]


if __name__ == '__main__':
    LLAMA_KEY = os.environ.get('LLAMA_CLOUD_API_KEY')

    if not LLAMA_KEY:
        print('Set LLAMA_CLOUD_API_KEY env var first')
        sys.exit(1)

    pdf_path = '/Users/adiimathur/Downloads/📦 Misc & Unsorted/Project Titan_IM_2025Dec12 (1) (1).pdf'

    print('=== Step 1: LlamaParse the PDF ===')
    full_deck = extract_with_llamaparse(pdf_path, LLAMA_KEY)
    print(f'Full deck: {len(full_deck)} chars')

    # Chunk deck to first 8 KB (faster iteration, proves the architecture)
    chunked_deck = full_deck[:8000]
    print(f'Chunked deck: {len(chunked_deck)} chars')

    email_body = '''Subject: Pitch Deck - Monitra Healthcare - 24x7 Heart Monitoring
Hi, I'm Avin, founder of Monitra Healthcare. Continuous cardiac monitoring.
$5M raised from Equanimity and Kotak. Looking to raise $12M Series B.
LinkedIn: https://www.linkedin.com/in/avin-agarwal-monitra
Previous exit: Concept Medical (acquired 2021)
Founders: Avin Agarwal (Cornell MBA, ex-Medtronic), Dr. Patel (Carnegie Mellon)
TAM: 24x7 wearable cardiac monitoring - $5B globally by 2028
Rs 12.1 cr FY26 projected revenue (110% CAGR)
'''

    print('\n=== Test 1: 49-field schema, chunked (8KB) deck ===')
    result = run_full_pipeline(chunked_deck, email_body, PRODUCTION_SCHEMA[:49])
    extracted = result['extracted_deck_data']
    nonempty = {k: v for k, v in extracted.items() if v and v != 'Not stated'}
    print(f'  extracted: {len(nonempty)}/{len(PRODUCTION_SCHEMA[:49])} non-empty')
    for k, v in list(nonempty.items())[:8]:
        print(f'    {k}: {str(v)[:80]}')
    print(f'  score: {result["scoring"].get("score")}')
    print(f'  truth_score: {result["verification"].get("truth_score")}')
    red_flags = result['risk_analysis'].get('red_flags', [])
    print(f'  red flags: {len(red_flags)}, green flags: {len(result["risk_analysis"].get("green_flags", []))}')
    # Check if "no pitch deck" warning present
    red_flag_text = ' '.join(r.get('description', '') for r in red_flags)
    if 'No pitch deck' in red_flag_text or 'Absence of Pitch' in red_flag_text:
        print('  ⚠️  RISK AGENT SAID "no pitch deck" — chained context is broken')
    else:
        print('  ✓ risk agent saw the deck')
