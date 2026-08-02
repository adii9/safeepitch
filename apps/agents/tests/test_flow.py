"""Tests for the SafeDeck Flow logic — the deterministic truth_score override.

These tests verify the post-processing step that overrides the LLM's
truth_score with the deterministic Python one. We do NOT exercise the
actual crew kickoff here (that requires LLM calls). Instead, we simulate
the raw output and verify the override logic.
"""

import importlib.util

import pytest

from safedeck.models import (
    DiscrepancyAnalysis,
    FlagSummary,
    VerificationReport,
    VerifiedDataPoint,
)


HAS_CREWAI = importlib.util.find_spec("crewai") is not None
skip_no_crewai = pytest.mark.skipif(not HAS_CREWAI, reason="crewai not installed")


class TestFlowPostProcessing:
    """The flow's `save_final_step` method does post-processing on the crew's
    raw output. We test the core invariant: the deterministic truth_score
    from `make_verification_report` ends up in the output.

    These tests don't require crewai — they re-implement the override logic
    inline so they run anywhere."""

    def test_overrides_llm_truth_score(self):
        """Simulate crew output where LLM set truth_score=50, but the
        deterministic rubric produces 88. After override, the report's
        truth_score should be 88."""
        from safedeck.models import make_verification_report

        crew_output = {
            "extracted_deck_data": {"company_name": "Acme"},
            "internet_verified_data": {
                "revenue": {"value": "$500k", "source_url": "https://tracxn.com/x"},
            },
            "risk_analysis": {
                "red_flags": [{"flag": "r1", "description": "x"}],
                "green_flags": [],
            },
            "verification": {
                "truth_score": 50,  # LLM's guess — wrong
                "tier": "low",
                "summary": "Concerns.",
            },
            "scoring": {"score": 70, "reasoning": "OK"},
        }

        # This is the same logic the flow's save_final_step applies
        verification = crew_output["verification"] or {}
        summary = verification.get("summary") or ""
        risk = crew_output["risk_analysis"] or {}
        verified = crew_output["internet_verified_data"] or {}

        override = make_verification_report(
            red_flags=risk.get("red_flags", []),
            green_flags=risk.get("green_flags", []),
            internet_verified_data=verified,
            summary=summary,
        )
        crew_output["verification"] = override.model_dump()

        # 100 - 12 (red flag) + 0 + 0 = 88
        assert crew_output["verification"]["truth_score"] == 88
        assert crew_output["verification"]["tier"] == "high"  # 88 >= 85

    def test_handles_string_output(self):
        """The flow can receive either a dict or a JSON string from the crew."""
        import json

        from safedeck.models import make_verification_report

        raw = json.dumps({
            "verification": {"summary": "OK."},
            "risk_analysis": {"red_flags": [], "green_flags": []},
            "internet_verified_data": {},
        })

        report = json.loads(raw) if isinstance(raw, str) else raw
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

        assert override.truth_score == 100
        assert override.tier == "high"

    def test_handles_missing_verification(self):
        """If the crew didn't return verification, the override still works."""
        from safedeck.models import make_verification_report

        report = {"risk_analysis": {}, "internet_verified_data": {}}
        verification = report.get("verification") or {}
        summary = verification.get("summary") or ""

        override = make_verification_report([], [], {}, summary)
        assert override.truth_score == 100


@skip_no_crewai
class TestEvaluationCriteriaBuilder:
    """The flow builds a client_schema from evaluation_criteria."""

    def test_company_name_always_first(self):
        """The flow inserts 'company_name' as the first field if not present."""
        from safedeck.flow import _make_label

        # Simulate the field-building logic from the flow
        evaluation_criteria = {"must_have": ["revenue", "tam"], "nice_to_have": []}
        all_field_keys = evaluation_criteria["must_have"] + evaluation_criteria["nice_to_have"]
        if "company_name" not in all_field_keys:
            all_field_keys.insert(0, "company_name")

        all_fields = [{"key": k, "label": _make_label(k)} for k in all_field_keys]
        assert all_fields[0]["key"] == "company_name"
        assert all_fields[1]["key"] == "revenue"
        assert all_fields[2]["key"] == "tam"

    def test_company_name_not_duplicated(self):
        from safedeck.flow import _make_label

        evaluation_criteria = {"must_have": ["company_name", "revenue"], "nice_to_have": []}
        all_field_keys = evaluation_criteria["must_have"] + evaluation_criteria["nice_to_have"]
        if "company_name" not in all_field_keys:
            all_field_keys.insert(0, "company_name")

        all_fields = [{"key": k, "label": _make_label(k)} for k in all_field_keys]
        keys = [f["key"] for f in all_fields]
        assert keys.count("company_name") == 1

    def test_make_label_uppercases_acronyms(self):
        from safedeck.flow import _make_label

        assert _make_label("tam") == "TAM"
        assert _make_label("ARR") == "ARR"
        assert _make_label("mrr") == "MRR"
        assert _make_label("nps") == "NPS"
        assert _make_label("ltv") == "LTV"

    def test_make_label_title_cases_other_keys(self):
        from safedeck.flow import _make_label

        assert _make_label("company_name") == "Company Name"
        assert _make_label("two_x_founder_flag") == "Two X Founder Flag"
