"""Tests for Pydantic models — validation, serialization, dynamic model creation."""

import pytest
from pydantic import ValidationError

from safedeck.models import (
    DiscrepancyAnalysis,
    FlagSummary,
    FinalConsolidatedReport,
    StartupRating,
    VerifiedDataPoint,
    VerificationReport,
    create_dynamic_model,
)


class TestFlagSummary:
    def test_requires_flag_and_description(self):
        with pytest.raises(ValidationError):
            FlagSummary()

    def test_accepts_minimal(self):
        f = FlagSummary(flag="x", description="y")
        assert f.flag == "x"
        assert f.description == "y"


class TestDiscrepancyAnalysis:
    def test_default_empty_lists(self):
        d = DiscrepancyAnalysis()
        assert d.red_flags == []
        assert d.green_flags == []

    def test_validate_round_trip(self):
        d = DiscrepancyAnalysis(
            red_flags=[FlagSummary(flag="r1", description="x")],
            green_flags=[FlagSummary(flag="g1", description="y")],
        )
        json = d.model_dump_json()
        parsed = DiscrepancyAnalysis.model_validate_json(json)
        assert parsed.red_flags[0].flag == "r1"


class TestVerifiedDataPoint:
    def test_default_source_url(self):
        v = VerifiedDataPoint(value="x")
        assert v.source_url == "Not found"

    def test_value_required(self):
        with pytest.raises(ValidationError):
            VerifiedDataPoint()


class TestVerificationReport:
    def test_truth_score_bounded(self):
        with pytest.raises(ValidationError):
            VerificationReport(tier="high", summary="x", truth_score=101)
        with pytest.raises(ValidationError):
            VerificationReport(tier="high", summary="x", truth_score=-1)

    def test_tier_required(self):
        with pytest.raises(ValidationError):
            VerificationReport(summary="x")


class TestStartupRating:
    def test_requires_score_and_reasoning(self):
        with pytest.raises(ValidationError):
            StartupRating()
        s = StartupRating(score=85.5, reasoning="Solid team.")
        assert s.score == 85.5


class TestCreateDynamicModel:
    def test_creates_model_with_optional_fields(self):
        fields = [
            {"key": "company_name", "label": "Company Name"},
            {"key": "revenue", "label": "Revenue"},
        ]
        Model = create_dynamic_model("DeckExtractionData", fields)

        # All fields are Optional[str] — check via the union type, not string repr
        from typing import Optional, Union, get_args
        ann = Model.model_fields["company_name"].annotation
        assert get_args(ann) == (str, type(None))  # Optional[str]

        # Should validate with all fields
        m = Model.model_validate({"company_name": "Acme", "revenue": "$500k"})
        assert m.company_name == "Acme"
        assert m.revenue == "$500k"

        # Should validate with empty input
        m = Model.model_validate({})
        assert m.company_name is None

    def test_skips_fields_without_key(self):
        fields = [{"key": "company_name"}, {"label": "no key"}]  # second is dropped
        Model = create_dynamic_model("M", fields)
        assert "company_name" in Model.model_fields
        assert "no key" not in Model.model_fields


class TestFinalConsolidatedReport:
    def test_full_report_round_trip(self):
        report = FinalConsolidatedReport(
            extracted_deck_data={"company_name": "Acme", "revenue": "$500k"},
            internet_verified_data={
                "revenue": VerifiedDataPoint(value="$500k", source_url="pitch_deck"),
            },
            risk_analysis=DiscrepancyAnalysis(
                red_flags=[FlagSummary(flag="r1", description="x")],
            ),
            scoring=StartupRating(score=85, reasoning="Solid."),
            verification=VerificationReport(tier="high", summary="All good.", truth_score=92),
        )
        json = report.model_dump_json()
        parsed = FinalConsolidatedReport.model_validate_json(json)
        assert parsed.extracted_deck_data["company_name"] == "Acme"
        assert parsed.verification.truth_score == 92
        assert parsed.risk_analysis.red_flags[0].flag == "r1"
