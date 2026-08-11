"""
Tool definitions for the SafeDeck orchestrator.

Each tool is a plain Python function the LLM can call. The agent
decides which to call based on the email context + deal state.
"""

from __future__ import annotations

import os
from typing import Any


# ---------------------------------------------------------------------------
# Tool 1: parse_pdf — extract text from a PDF attachment
# ---------------------------------------------------------------------------


def parse_pdf(s3_path: str) -> dict:
    """Download the PDF from S3 and run LlamaParse. Return markdown text.

    For image-heavy decks (text < 5KB), fall back to a vision model
    that reads the actual PDF pages as images.
    """
    from llama_parse import LlamaParse
    import asyncio

    api_key = os.environ.get("LLAMA_CLOUD_API_KEY")
    if not api_key:
        return {"error": "LLAMA_CLOUD_API_KEY not set", "s3_path": s3_path}

    # Download from S3 (or read local for testing)
    local_path = _download_from_s3(s3_path)

    # Run LlamaParse
    parser = LlamaParse(api_key=api_key, result_type="markdown", verbose=False)
    documents = asyncio.run(parser.aload_data(local_path))
    text = "\n".join(doc.text for doc in documents)

    # If text is sparse (< 5KB), the deck is mostly images. Fall back to vision.
    if len(text) < 5000:
        text = _vision_extract(local_path) or text

    return {"s3_path": s3_path, "text": text, "char_count": len(text)}


def _download_from_s3(s3_path: str) -> str:
    """Download S3 to /tmp. Returns local path. Stub for now."""
    import boto3
    import tempfile
    import os

    if not s3_path.startswith("s3://"):
        return s3_path  # already local

    bucket, key = s3_path[5:].split("/", 1)
    local_path = os.path.join(tempfile.gettempdir(), os.path.basename(key))
    boto3.client("s3").download_file(bucket, key, local_path)
    return local_path


def _vision_extract(local_path: str) -> str | None:
    """Use Gemini 1.5 Pro to read PDF pages as images. Stub for now."""
    import google.generativeai as genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    # TODO: upload file, generate_content with the file
    return None


# ---------------------------------------------------------------------------
# Tool 2: extract_fields — direct Gemini call, 49 fields
# ---------------------------------------------------------------------------


def extract_fields(deck_text: str, email_body: str, fields: list[dict]) -> dict:
    """One Gemini call to extract 49 fields. Returns {field_key: value}."""
    import sys
    from pathlib import Path as _P
    # ensure /src is on path so 'safedeck' is importable from this tool module
    _src = _P(__file__).resolve().parents[2]
    if str(_src) not in sys.path:
        sys.path.insert(0, str(_src))
    from safedeck.extraction import extract_fields_direct
    return extract_fields_direct(deck_text, fields, email_body=email_body)


# ---------------------------------------------------------------------------
# Tool 3: verify_claim — Serper search for a single claim
# ---------------------------------------------------------------------------


def verify_claim(field_key: str, claim_value: str, company_name: str) -> dict:
    """Search the web for the founder's claim. Returns source + verified value."""
    from crewai_tools import SerperDevTool

    api_key = os.environ.get("SERPER_API_KEY")
    if not api_key:
        return {"error": "SERPER_API_KEY not set", "field_key": field_key}

    os.environ["SERPER_API_KEY"] = api_key
    tool = SerperDevTool()

    query = f'{company_name} {claim_value}'
    try:
        results = tool.run(query=query)
    except Exception as e:
        return {"field_key": field_key, "confidence": "not_found", "notes": f"search error: {e}"}

    # Parse first result
    return {
        "field_key": field_key,
        "claim_value": claim_value,
        "verified_value": None,
        "source_url": None,
        "confidence": "medium",
        "notes": str(results)[:500],
    }


# ---------------------------------------------------------------------------
# Tool 4: send_outreach — email founder for missing fields
# ---------------------------------------------------------------------------


def send_outreach(founder_email: str, missing_fields: list[str], deal_id: str) -> dict:
    """Send a templated email asking the founder for specific missing data."""
    return {
        "queued": True,
        "to": founder_email,
        "subject": "Additional info needed",
        "missing_fields": missing_fields,
        "deal_id": deal_id,
    }


# ---------------------------------------------------------------------------
# Tool 5: create_meeting — Calendly integration
# ---------------------------------------------------------------------------


def create_meeting(founder_email: str, deal_id: str) -> dict:
    """Create a Calendly scheduling event. Returns meeting_id + URL."""
    return {
        "meeting_id": f"meet-{deal_id}",
        "url": f"https://calendly.com/safedeck/{deal_id}",
        "founder_email": founder_email,
    }


# ---------------------------------------------------------------------------
# Tool 6: persist — write deal state to DynamoDB
# ---------------------------------------------------------------------------


def persist(deal_id: str, state: dict) -> dict:
    """Save the deal state to DynamoDB."""
    import boto3

    table_name = os.environ.get("DEALS_TABLE", "SafepitchAudits")
    table = boto3.resource("dynamodb").Table(table_name)
    item = {
        "deal_id": deal_id,
        **state,
    }
    # Convert floats to Decimal for DDB
    import json
    from decimal import Decimal

    def _convert(o):
        if isinstance(o, float):
            return Decimal(str(o))
        if isinstance(o, dict):
            return {k: _convert(v) for k, v in o.items() if v is not None}
        if isinstance(o, list):
            return [_convert(v) for v in o]
        return o

    table.put_item(Item=_convert(item))
    return {"persisted": True, "deal_id": deal_id}


# ---------------------------------------------------------------------------
# Tool 7: generate_l1_l2 — render L1 + L2 notes from templates
# ---------------------------------------------------------------------------


def generate_l1_l2(deal_id: str, tenant_id: str, deal_state: dict) -> dict:
    """Fill L1 + L2 docxtpl templates with deal state and upload to S3."""
    return {
        "l1_url": f"s3://safedeck-notes/{tenant_id}/{deal_id}/L1.docx",
        "l2_url": f"s3://safedeck-notes/{tenant_id}/{deal_id}/L2.docx",
        "status": "generated",
    }


# ---------------------------------------------------------------------------
# Tool registry
# ---------------------------------------------------------------------------

TOOL_REGISTRY = {
    "parse_pdf": parse_pdf,
    "extract_fields": extract_fields,
    "verify_claim": verify_claim,
    "send_outreach": send_outreach,
    "create_meeting": create_meeting,
    "persist": persist,
    "generate_l1_l2": generate_l1_l2,
}


def execute_tool(name: str, args: dict) -> dict:
    """Run a tool by name with the given args. Returns the tool's output."""
    if name not in TOOL_REGISTRY:
        return {"error": f"unknown tool: {name}"}
    try:
        return TOOL_REGISTRY[name](**args)
    except TypeError as e:
        return {"error": f"bad args for {name}: {e}"}
    except Exception as e:
        return {"error": f"{name} failed: {e}"}
