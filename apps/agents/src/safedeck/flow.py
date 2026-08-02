"""SafeDeck CrewAI Flow — orchestrates audit lifecycle with persistent state.

The flow:
1. Build client_schema from tenant evaluation_criteria
2. Kick off the 5-agent crew
3. Override the LLM's truth_score with the deterministic Python one
4. Persist the final report to flow state (and S3, when deployed)

Ported from safepitch/main.py. Run locally with:
    uv run python -m safedeck.flow
"""

import json
import os
import sys
from pathlib import Path

from crewai.flow.flow import Flow, listen, start
from crewai.flow.persistence import persist

from safedeck.crew import SafeDeckCrew
from safedeck.models import (
    make_verification_report,
)

# Allow `python -m safedeck.flow` from the repo root
REPO_ROOT = Path(__file__).resolve().parents[2]


def _make_label(key: str) -> str:
    """Auto-generate a human label from a snake_case key."""
    upper_keys = {"tam", "sam", "som", "nps", "mrr", "arr", "acv", "ltv"}
    if key.lower() in upper_keys:
        return key.upper()
    return key.replace("_", " ").title()


class SafeDeckFlow(Flow):
    @start()
    def run_crew(self):
        """Run the 5-agent audit pipeline."""
        provided_inputs = self.state.get("inputs", {})
        evaluation_criteria = provided_inputs.get("evaluation_criteria")

        all_field_keys = []
        if evaluation_criteria:
            must_have = evaluation_criteria.get("must_have", [])
            nice_to_have = evaluation_criteria.get("nice_to_have", [])
            all_field_keys = must_have + nice_to_have
            print(
                f"evaluation_criteria loaded: {len(must_have)} must_have + "
                f"{len(nice_to_have)} nice_to_have = {len(all_field_keys)} total fields"
            )
        else:
            print("No evaluation_criteria in state — no fields will be extracted.")

        if "company_name" not in all_field_keys:
            all_field_keys.insert(0, "company_name")
            print("Added company_name to extraction fields.")

        all_fields = [
            {"key": k, "label": _make_label(k)} for k in all_field_keys
        ]

        client_schema = {"kyc": all_fields}
        print(f"client_schema built with {len(all_fields)} fields.")

        def format_fields(fields: list) -> str:
            return "\n".join([f"- {f['label']} (JSON key: {f['key']})" for f in fields])

        MOCK_DECK = """
        # Financial Overview
        The company is seeking $2M at a $10M pre-money valuation.
        Current FY Revenue is $500k with an EBITDA margin of 15%.

        # Market & Team
        TAM is $1.2B in the EdTech sector.
        Founders: Jane Doe (Ex-Google) and John Smith (IIT Alumni).
        Company incorporated in 2022 in Bangalore, India.
        """

        inputs = {
            "company_name": provided_inputs.get("company_name", "Edutech Global"),
            "pitch_deck_content": provided_inputs.get("pitch_deck_content", MOCK_DECK),
            "email_body": provided_inputs.get(
                "email_body",
                "Subject: Pitch Deck - Edutech Global. "
                "Hi, I'm Jane. We are building an AI-led learning platform. "
                "LinkedIn: linkedin.com/in/janedoe-example",
            ),
            "dynamic_kyc_fields": format_fields(client_schema["kyc"]),
            "dynamic_financial_fields": "",
            "dynamic_market_fields": "",
        }

        rating_criteria = provided_inputs.get("rating_criteria")
        if rating_criteria:
            inputs["rating_criteria"] = rating_criteria
            print("rating_criteria injected into crew inputs.")

        print(f"--- Starting Verified Audit for {inputs['company_name']} ---")

        result = SafeDeckCrew(client_schema=client_schema).crew().kickoff(inputs=inputs)
        return result.raw

    @listen(run_crew)
    @persist()
    def save_final_step(self, audit_report):
        """Override truth_score with the deterministic one, then persist."""
        print("\n\n=== FINAL AUDIT REPORT (JSON) ===")
        print(audit_report)

        try:
            report = json.loads(audit_report) if isinstance(audit_report, str) else audit_report
            verification = report.get("verification") or {}
            summary = verification.get("summary") or ""
            risk = report.get("risk_analysis") or {}
            verified = report.get("internet_verified_data") or {}

            override = make_verification_report(
                red_flags=risk.get("red_flags", []),
                green_flags=risk.get("green_flags", []),
                internet_verified_data=verified,
                summary=summary,
            )
            report["verification"] = override.model_dump()
            print(f"\n[verify] deterministic truth_score = {override.truth_score} (tier: {override.tier})")

            if isinstance(audit_report, str):
                audit_report = json.dumps(report)
            else:
                audit_report = report
        except Exception as e:
            print(f"\n[verify] WARNING: could not override truth_score deterministically: {e}")

        self.state["audit_report"] = audit_report

        # Save locally for review (fails silently in read-only lambda env if not /tmp)
        try:
            with open("test_audit_result.json", "w") as f:
                f.write(str(audit_report))
        except IOError:
            pass

        print("\n--- Final step data successfully persisted! ---")
        return {"audit_report": audit_report}


def run():
    """Local entry point."""
    try:
        flow = SafeDeckFlow()
        flow.kickoff()
    except Exception as e:
        print(f"Error during local test: {e}")


if __name__ == "__main__":
    run()
