"""
Direct Gemini extraction — bypasses CrewAI's chained task pipeline.

CrewAI's chained agent context was dropping extraction results when
the deck text was large. This module calls Gemini directly with the
deck text + schema, gets back a clean JSON object, and returns it
to the flow.

Cost: ~30K tokens per deck (92KB LlamaParse text + 49-field schema).
      At gemini-2.5-flash pricing ($0.30/1M input, $2.50/1M output),
      that's $0.01 per deck.
"""

import json
import os
from typing import Any

import google.generativeai as genai


def extract_fields_direct(
    deck_text: str,
    fields: list[dict],
    *,
    api_key: str | None = None,
    model: str = "gemini-2.5-flash",
    email_body: str = "",
    max_output_tokens: int = 8192,
) -> dict[str, Any]:
    """Call Gemini directly with the deck + schema, return extracted fields.

    Args:
        deck_text: LlamaParse-extracted markdown of the pitch deck
        fields: list of {key, label, description} dicts (the 49 fields)
        api_key: GEMINI_API_KEY (default: read from env)
        model: which Gemini model (default: gemini-2.5-flash for cost)
        email_body: forwarded email body (some founders put data here)
        max_output_tokens: limit response size (49 fields = ~2-3K tokens)

    Returns:
        dict mapping field_key -> extracted_value (or "Not stated")
    """
    api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)

    field_list = "\n".join(
        f"- {f['key']}: {f.get('label', f['key'])}"
        for f in fields
    )

    prompt = f"""You are a precise pitch-deck data extractor. Extract the following fields from the pitch deck and (if present) the email body below.

FIELDS TO EXTRACT:
{field_list}

RULES:
1. For each field, return the value as it appears in the deck or email.
2. If a field is not mentioned, return "Not stated" — do NOT invent.
3. For numeric fields, preserve units (e.g. "$5M", "Rs. 12.1 cr").
4. For people, include name + role/title (e.g. "Avin Agarwal (CEO)").
5. If a value is only in the email body (not the deck), use the email body value.
6. Be concise — values should be one line each, max ~100 chars.

OUTPUT FORMAT (strict JSON):
{{"field_key": "value or 'Not stated'", ...}}

DECK:
{deck_text}

EMAIL BODY:
{email_body or "(none)"}
"""

    model_obj = genai.GenerativeModel(
        model,
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": max_output_tokens,
        },
    )

    response = model_obj.generate_content(prompt)
    raw = response.text

    try:
        extracted = json.loads(raw)
    except json.JSONDecodeError:
        # Gemini sometimes wraps JSON in code fences. Strip and retry.
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
            if cleaned.endswith("```"):
                cleaned = "\n".join(cleaned.split("\n")[:-1])
        extracted = json.loads(cleaned)

    # Ensure every requested field has an entry (default "Not stated")
    out: dict[str, Any] = {}
    for f in fields:
        key = f["key"]
        val = extracted.get(key, "Not stated")
        if val is None or val == "":
            val = "Not stated"
        out[key] = val

    return out
