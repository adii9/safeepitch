"""
test_run.py — manually run the SafeDeck crew on a real PDF.

Ported from safepitch/test_run.py. Used as a smoke test for the
5-agent pipeline along with the pytest suite in tests/.

Usage:
    PYTHONPATH=apps/agents/src python apps/agents/tests/test_run.py
"""

import os
import sys
import json
import pdfplumber

# Allow `from safedeck.crew import SafeDeckCrew` when run as a script.
# Tests in this folder also work via pytest, which sets up its own sys.path.
_HERE = os.path.dirname(os.path.abspath(__file__))
_AGENTS_SRC = os.path.abspath(os.path.join(_HERE, "..", "src"))
if _AGENTS_SRC not in sys.path:
    sys.path.insert(0, _AGENTS_SRC)

from safedeck.crew import SafeDeckCrew


def extract_text_from_pdf(pdf_path):
    text = ""
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return text
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return text


def main():
    pdf_path = os.environ.get(
        "TEST_PDF",
        "/Users/adiimathur/Downloads/Project Titan_IM_2025Dec12 (1).pdf",
    )
    print(f"Parsing PDF: {pdf_path}")
    pitch_deck_content = extract_text_from_pdf(pdf_path)

    inputs = {
        "company_name": os.environ.get("TEST_COMPANY", "Project Titan"),
        "pitch_deck_content": pitch_deck_content,
        "email_body": "Hi, please review this pitch deck for Project Titan.",
        "excel_schema": "{}",
    }

    print("Kicking off crew...")
    crew_instance = SafeDeckCrew().crew()
    result = crew_instance.kickoff(inputs=inputs)

    print("Crew finished. Saving output...")
    out_path = os.environ.get("TEST_OUTPUT", "test_audit_result.json")
    with open(out_path, "w") as f:
        try:
            json_str = result.raw if hasattr(result, "raw") else str(result)
            try:
                parsed = json.loads(json_str)
                json.dump(parsed, f, indent=2)
            except json.JSONDecodeError:
                f.write(json_str)
        except Exception as e:
            f.write(str(result))
            print(f"Saved result with exception: {e}")


if __name__ == "__main__":
    main()
