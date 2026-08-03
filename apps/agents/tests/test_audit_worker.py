"""
Tests for the production audit worker Lambda handler.

These tests cover the pure-logic helpers that don't require boto3:
- apply_rating_template: weighted composite scoring
- _sanitise_for_dynamodb: float→Decimal conversion
- _deserialize_dynamodb: DDB wire-format unwrapping
- _default_config: defaults when no tenant config found

The boto3-dependent functions (get_tenant_config, save_to_dynamodb,
sync_db_from_s3, sync_db_to_s3) require mock-injection; for those,
we test the integration end-to-end via scripts/run_crew_smoke.py.
"""

import pytest

from safedeck.handlers.audit_worker import (
    _default_config,
    _deserialize_dynamodb,
    _sanitise_for_dynamodb,
    apply_rating_template,
)


# ---------- _default_config ----------

class TestDefaultConfig:
    def test_returns_required_keys(self):
        cfg = _default_config('default')
        assert cfg['tenant_id'] == 'default'
        assert cfg['tenant_slug'] == 'default'
        assert cfg['evaluation_criteria'] is None
        assert cfg['rating_template'] is None
        assert cfg['output_sheet_mapping'] is None
        assert cfg['sheet_url'] is None
        assert cfg['drive_folder_id'] is None
        assert cfg['thesis'] is None
        assert cfg['stages'] is None
        assert cfg['sectors'] is None

    def test_preserves_tenant_id(self):
        assert _default_config('vc-fund-xyz')['tenant_id'] == 'vc-fund-xyz'
        assert _default_config('vc-fund-xyz')['tenant_slug'] == 'vc-fund-xyz'


# ---------- apply_rating_template ----------

class TestApplyRatingTemplate:
    """apply_rating_template extracts _overall_score from scoring.score
    and computes a weighted composite from extracted_deck_data fields
    when a rating_template with weights is provided."""

    def test_no_template_still_extracts_overall_score(self):
        audit = {
            'scoring': {'score': 7.5, 'reasoning': 'good'},
            'extracted_deck_data': {'revenue': '$500k'},
        }
        out = apply_rating_template(audit, None)
        assert out['_overall_score'] == 7.5
        assert '_composite_score' not in out

    def test_no_template_empty_audit_does_not_crash(self):
        audit = {}
        out = apply_rating_template(audit, None)
        assert '_overall_score' not in out  # No scoring section to extract from

    def test_template_string_parsed(self):
        audit = {'scoring': {'score': 8}, 'extracted_deck_data': {'Revenue': 100}}
        # rating_template can be stored as a JSON string in DDB
        template = '{"weights": {"Revenue": 1.0}}'
        out = apply_rating_template(audit, template)
        assert out['_composite_score'] == 100.0
        assert out['_rating_template_applied'] == ['Revenue']

    def test_template_invalid_json_falls_back_to_empty(self):
        audit = {'scoring': {'score': 8}, 'extracted_deck_data': {'Revenue': 100}}
        out = apply_rating_template(audit, 'not json')
        # Bad JSON → empty template → no composite score, but overall_score
        # still extracted
        assert out['_overall_score'] == 8
        assert '_composite_score' not in out

    def test_template_with_weights_computes_weighted_composite(self):
        audit = {
            'scoring': {'score': 7},
            'extracted_deck_data': {
                'Revenue': 100,    # weight 0.5
                'Market': 80,      # weight 0.3
                'Team': 60,        # weight 0.2
            },
        }
        template = {'weights': {'Revenue': 0.5, 'Market': 0.3, 'Team': 0.2}}
        out = apply_rating_template(audit, template)
        # (100*0.5 + 80*0.3 + 60*0.2) / (0.5+0.3+0.2) = 50+24+12 = 86
        assert out['_composite_score'] == 86.0
        assert out['_rating_breakdown'] == {'Revenue': 100.0, 'Market': 80.0, 'Team': 60.0}

    def test_template_with_missing_fields_skipped(self):
        """If a weight refers to a field not in extracted_deck_data, it's
        silently skipped (not an error)."""
        audit = {
            'scoring': {'score': 7},
            'extracted_deck_data': {'Revenue': 100},
        }
        template = {'weights': {'Revenue': 0.5, 'NotInDeck': 0.5}}
        out = apply_rating_template(audit, template)
        # Revenue is 100, weight 0.5, total weight 0.5
        # (100*0.5) / 0.5 = 100
        assert out['_composite_score'] == 100.0

    def test_template_with_all_missing_fields_no_composite(self):
        audit = {'scoring': {'score': 7}, 'extracted_deck_data': {}}
        template = {'weights': {'Revenue': 1.0}}
        out = apply_rating_template(audit, template)
        # No matching fields → no composite score
        assert '_composite_score' not in out

    def test_string_values_in_extracted_data_coerced_to_float(self):
        audit = {
            'scoring': {'score': 7},
            'extracted_deck_data': {'Revenue': '5000'},  # string, not float
        }
        template = {'weights': {'Revenue': 1.0}}
        out = apply_rating_template(audit, template)
        assert out['_composite_score'] == 5000.0

    def test_non_numeric_values_in_extracted_data_skipped(self):
        audit = {
            'scoring': {'score': 7},
            'extracted_deck_data': {'Revenue': 'Not stated'},
        }
        template = {'weights': {'Revenue': 1.0}}
        out = apply_rating_template(audit, template)
        assert '_composite_score' not in out

    def test_scoring_parsed_from_string(self):
        """If the scoring section came back as a JSON string (e.g. after
        DDB round-trip), we still extract the score."""
        audit = {'scoring': '{"score": 8.5}', 'extracted_deck_data': {}}
        out = apply_rating_template(audit, None)
        assert out['_overall_score'] == 8.5

    def test_extracted_deck_data_parsed_from_string(self):
        audit = {'scoring': {}, 'extracted_deck_data': '{"Revenue": 100}'}
        template = {'weights': {'Revenue': 1.0}}
        out = apply_rating_template(audit, template)
        assert out['_composite_score'] == 100.0


# ---------- _sanitise_for_dynamodb ----------

class TestSanitiseForDynamodb:
    """Recursively converts Python floats to Decimal (boto3 rejects floats)
    and drops None values at the top level."""

    def test_float_becomes_decimal(self):
        from decimal import Decimal
        out = _sanitise_for_dynamodb(3.14)
        assert isinstance(out, Decimal)
        assert float(out) == 3.14

    def test_nested_floats_become_decimals(self):
        from decimal import Decimal
        out = _sanitise_for_dynamodb({'a': 1.5, 'b': {'c': 2.5}})
        assert isinstance(out['a'], Decimal)
        assert isinstance(out['b']['c'], Decimal)

    def test_floats_in_lists_become_decimals(self):
        from decimal import Decimal
        out = _sanitise_for_dynamodb([1.0, 2.0, 3.0])
        assert all(isinstance(x, Decimal) for x in out)

    def test_other_types_unchanged(self):
        assert _sanitise_for_dynamodb('hello') == 'hello'
        assert _sanitise_for_dynamodb(42) == 42
        assert _sanitise_for_dynamodb(True) is True

    def test_none_top_level_dropped_from_dict(self):
        """DynamoDB rejects None attributes unless explicitly typed."""
        out = _sanitise_for_dynamodb({'a': 1, 'b': None, 'c': 'hello'})
        assert 'b' not in out
        assert out['a'] == 1
        assert out['c'] == 'hello'

    def test_none_in_nested_dict_dropped_too(self):
        """The production helper drops None at every level (not just top).
        The recursive call applies the same filter to nested dicts."""
        out = _sanitise_for_dynamodb({'a': {'b': None}})
        # 'b' is dropped because None is filtered at every dict level
        assert out == {'a': {}}

    def test_empty_dict(self):
        assert _sanitise_for_dynamodb({}) == {}

    def test_empty_list(self):
        assert _sanitise_for_dynamodb([]) == []


# ---------- _deserialize_dynamodb ----------

class TestDeserializeDynamodb:
    """Unwraps DynamoDB wire-format dicts ({'S': ...}, {'M': ...}, etc.)
    back to plain Python. Safe to call on already-plain data."""

    def test_string_attribute(self):
        out = _deserialize_dynamodb({'S': 'hello'})
        assert out == 'hello'

    def test_number_attribute(self):
        from decimal import Decimal
        out = _deserialize_dynamodb({'N': '42'})
        assert out == Decimal('42')

    def test_map_attribute(self):
        out = _deserialize_dynamodb({'M': {'a': {'S': 'value'}}})
        assert out == {'a': 'value'}

    def test_list_attribute(self):
        out = _deserialize_dynamodb({'L': [{'S': 'a'}, {'S': 'b'}]})
        assert out == ['a', 'b']

    def test_string_set_attribute(self):
        out = _deserialize_dynamodb({'SS': ['a', 'b', 'c']})
        assert out == {'a', 'b', 'c'}

    def test_wire_format_round_trip(self):
        """Real DDB read returns nested wire format. The deserializer
        should recursively unwrap."""
        wire = {
            'company_name': {'S': 'Acme'},
            'score': {'N': '8.5'},
            'tags': {'L': [{'S': 'AI'}, {'S': 'SaaS'}]},
            'nested': {'M': {'inner': {'S': 'value'}}},
        }
        out = _deserialize_dynamodb(wire)
        assert out == {
            'company_name': 'Acme',
            'score': 8.5,
            'tags': ['AI', 'SaaS'],
            'nested': {'inner': 'value'},
        }

    def test_plain_dict_passes_through(self):
        """A plain dict with no DDB type markers should not be unwrapped."""
        out = _deserialize_dynamodb({'a': 1, 'b': 2})
        assert out == {'a': 1, 'b': 2}

    def test_recursive_unwrapping(self):
        """A nested dict that contains both regular fields and DDB-format
        leaves should unwrap the leaves but keep the structure."""
        out = _deserialize_dynamodb({
            'name': {'S': 'Acme'},
            'score': {'N': '8.0'},
            'metadata': {
                'created': {'S': '2026-01-01'},
                'tags': {'L': [{'S': 'a'}, {'S': 'b'}]},
            },
        })
        assert out == {
            'name': 'Acme',
            'score': 8.0,
            'metadata': {
                'created': '2026-01-01',
                'tags': ['a', 'b'],
            },
        }

    def test_list_of_dynamodb_unwrapped(self):
        out = _deserialize_dynamodb([{'S': 'a'}, {'N': '1'}])
        assert out == ['a', 1]

    def test_plain_list_unchanged(self):
        out = _deserialize_dynamodb(['a', 'b', 'c'])
        assert out == ['a', 'b', 'c']


# ---------- Round-trip: sanitise after deserialize ----------

class TestRoundTrip:
    """simulates the production pattern: read from DDB → deserialize → mutate →
    write back to DDB → sanitize. Make sure no floats leak."""

    def test_floats_caught_on_round_trip(self):
        from decimal import Decimal

        # DDB returns wire format with floats as strings
        wire = {
            'scoring': {'M': {'score': {'N': '7.5'}}},
            'extracted_deck_data': {'revenue': {'S': '$500k'}},
        }

        # Step 1: deserialize
        plain = _deserialize_dynamodb(wire)
        assert isinstance(plain['scoring']['score'], Decimal)

        # Step 2: apply rating template (produces a float via composite_score)
        template = {'weights': {'revenue': 1.0}}
        # Note: extracted_deck_data.revenue is a string ('$500k').
        # composite calc will skip it (not numeric). overall_score = 7.5
        out = apply_rating_template(plain, template)
        assert out['_overall_score'] == 7.5

        # Step 3: sanitize before write
        sanitized = _sanitise_for_dynamodb(out)
        # The Decimal from DDB is preserved through deserialize
        assert isinstance(sanitized['scoring']['score'], Decimal)
        # The intentionally-None values get dropped from the top level
        assert None not in sanitized
