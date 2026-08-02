"""Tests for the deterministic truth_score rubric.

This is the core of SafeDeck's "different hard from soft" promise:
the same inputs must produce the same score across runs, regardless
of what the LLM does.

The rubric (locked — do not change without updating docs/SPEC.md + ADR):
    Start at 100.
    -12 per red_flag, +4 per green_flag.
    -1 per internet_verified_data field with source_url == "pitch_deck".
    -3 per internet_verified_data field with source_url == "Not found" or None.
    Clamp to [0, 100].
"""

import pytest

from safedeck.models import (
    FlagSummary,
    VerifiedDataPoint,
    VerificationReport,
    _tier_from_score,
    compute_truth_score,
    make_verification_report,
)


# ---------- compute_truth_score: pure function ----------

class TestComputeTruthScore:
    """Pure function tests — no LLM, no I/O."""

    def test_perfect_score_when_no_flags_and_all_verified(self):
        red_flags = []
        green_flags = []
        internet_verified_data = {
            "revenue": VerifiedDataPoint(value="$500k", source_url="https://tracxn.com/x"),
            "tam": VerifiedDataPoint(value="$1.2B", source_url="https://pitchbook.com/y"),
        }
        assert compute_truth_score(red_flags, green_flags, internet_verified_data) == 100

    def test_each_red_flag_deducts_12(self):
        flags = [FlagSummary(flag="revenue_inflation", description="x")]
        assert compute_truth_score(flags, [], {}) == 88

    def test_three_red_flags(self):
        flags = [FlagSummary(flag=f"flag_{i}", description="x") for i in range(3)]
        assert compute_truth_score(flags, [], {}) == 100 - 36

    def test_green_flag_adds_4(self):
        flags = [FlagSummary(flag="verified_exit", description="x")]
        # 100 + 4 = 104, clamped to 100
        assert compute_truth_score([], flags, {}) == 100

    def test_pitch_deck_source_deducts_1(self):
        data = {"revenue": VerifiedDataPoint(value="$500k", source_url="pitch_deck")}
        assert compute_truth_score([], [], data) == 99

    def test_not_found_source_deducts_3(self):
        data = {"revenue": VerifiedDataPoint(value="Not stated", source_url="Not found")}
        assert compute_truth_score([], [], data) == 97

    def test_null_source_deducts_3(self):
        data = {"revenue": VerifiedDataPoint(value="Not stated", source_url=None)}
        assert compute_truth_score([], [], data) == 97

    def test_real_external_url_no_deduction(self):
        data = {"revenue": VerifiedDataPoint(value="$500k", source_url="https://tracxn.com/x")}
        assert compute_truth_score([], [], data) == 100

    def test_mixed_sources(self):
        data = {
            "revenue": VerifiedDataPoint(value="$500k", source_url="https://tracxn.com/x"),
            "tam": VerifiedDataPoint(value="$1.2B", source_url="pitch_deck"),
            "founder": VerifiedDataPoint(value="Jane Doe", source_url="Not found"),
        }
        # 100 - 1 (tam) - 3 (founder) = 96
        assert compute_truth_score([], [], data) == 96

    def test_score_clamps_to_zero(self):
        flags = [FlagSummary(flag=f"f{i}", description="x") for i in range(20)]
        # 100 - 240 = -140 → clamp to 0
        assert compute_truth_score(flags, [], {}) == 0

    def test_score_clamps_to_100(self):
        flags = []
        green_flags = [FlagSummary(flag=f"g{i}", description="x") for i in range(100)]
        # 100 + 400 = 500 → clamp to 100
        assert compute_truth_score(flags, green_flags, {}) == 100

    def test_combined_inputs(self):
        red_flags = [FlagSummary(flag="unverified_exit", description="x")]
        green_flags = [FlagSummary(flag="verified_traction", description="x")]
        data = {
            "revenue": VerifiedDataPoint(value="$500k", source_url="pitch_deck"),
            "tam": VerifiedDataPoint(value="$1.2B", source_url="Not found"),
        }
        # 100 - 12 + 4 - 1 - 3 = 88
        assert compute_truth_score(red_flags, green_flags, data) == 88

    def test_dict_values_supported(self):
        """The rubric must accept both Pydantic models and plain dicts."""
        data = {"revenue": {"value": "$500k", "source_url": "pitch_deck"}}
        assert compute_truth_score([], [], data) == 99

    def test_empty_inputs(self):
        assert compute_truth_score([], [], {}) == 100

    def test_none_inputs_handled(self):
        """None instead of list/dict should be treated as empty."""
        assert compute_truth_score(None, None, None) == 100


# ---------- _tier_from_score ----------

class TestTierFromScore:
    @pytest.mark.parametrize("score,expected", [
        (100, "high"),
        (85, "high"),
        (84, "medium"),
        (60, "medium"),
        (59, "low"),
        (0, "low"),
    ])
    def test_tier_boundaries(self, score, expected):
        assert _tier_from_score(score) == expected


# ---------- make_verification_report ----------

class TestMakeVerificationReport:
    def test_returns_complete_report(self):
        red_flags = [FlagSummary(flag="r1", description="x")]
        green_flags = [FlagSummary(flag="g1", description="x")]
        data = {"revenue": VerifiedDataPoint(value="$500k", source_url="pitch_deck")}
        report = make_verification_report(red_flags, green_flags, data, "Summary text.")

        assert isinstance(report, VerificationReport)
        # 100 - 12 + 4 - 1 = 91 → tier "high" (>=85)
        assert report.tier == "high"
        assert report.summary == "Summary text."
        assert report.truth_score == 91

    def test_score_is_in_range(self):
        report = make_verification_report([], [], {}, "All good.")
        assert 0 <= report.truth_score <= 100
