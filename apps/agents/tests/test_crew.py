"""
Tests for SafeDeckCrew model selection.

These tests verify the production-safe model split:
- extraction_specialist uses EXTRACTION_MODEL (defaults to gemini-2.5-flash)
- All other agents use DEFAULT_MODEL (which reads CREW_MODEL env var)

The split exists because the extraction agent has to produce structured JSON
with 49+ fields from a 36 KB deck. Weak models (gemini-3.1-flash-lite-preview)
fail silently — they return empty objects. gemini-2.5-flash has the context
window and instruction-following to get this right. The other agents work
fine on the lighter model.

Verified by Phase 2 integration test on 2026-08-02.
"""

import os
import sys
from pathlib import Path

import pytest

# Skip the entire module if crewai isn't installed
pytest.importorskip("crewai")


@pytest.fixture(autouse=True)
def _clean_env_for_crew_test(monkeypatch):
    """Always unset CREW_MODEL and EXTRACTION_MODEL before each test,
    so the test controls the full env."""
    monkeypatch.delenv("CREW_MODEL", raising=False)
    monkeypatch.delenv("EXTRACTION_MODEL", raising=False)
    yield


def _reimport_crew_module():
    """Force a fresh read of the CREW_MODEL env var in crew.py.

    Must delete the safedeck package itself (not just its submodules) so
    that `from safedeck import crew` doesn't return the cached reference.
    """
    for mod_name in list(sys.modules.keys()):
        if mod_name == "safedeck" or mod_name.startswith("safedeck."):
            del sys.modules[mod_name]
    from safedeck import crew as crew_module
    return crew_module


def _build_crew():
    """Build a SafeDeckCrew + its underlying Crew for inspection."""
    from safedeck.crew import SafeDeckCrew
    crew_obj = SafeDeckCrew(client_schema={"kyc": [], "financial": [], "market": []})
    return crew_obj.crew()


# ---------- env var resolution ----------

class TestEnvVarResolution:
    """Without any env vars set, both models default to gemini-2.5-flash."""

    def test_extraction_model_default_is_25_flash(self, monkeypatch):
        monkeypatch.delenv("CREW_MODEL", raising=False)
        monkeypatch.delenv("EXTRACTION_MODEL", raising=False)
        c = _reimport_crew_module()
        assert "2.5" in c.EXTRACTION_MODEL
        assert "gemini" in c.EXTRACTION_MODEL

    def test_default_model_default_is_25_flash(self, monkeypatch):
        monkeypatch.delenv("CREW_MODEL", raising=False)
        monkeypatch.delenv("EXTRACTION_MODEL", raising=False)
        c = _reimport_crew_module()
        assert "2.5" in c.DEFAULT_MODEL

    def test_fallback_when_crew_model_set(self, monkeypatch):
        """If EXTRACTION_MODEL is unset but CREW_MODEL is set, extraction uses CREW_MODEL."""
        import os
        monkeypatch.setenv("CREW_MODEL", "gemini/gemini-3.1-flash-lite-preview")
        monkeypatch.delenv("EXTRACTION_MODEL", raising=False)
        print(f"\nDEBUG: CREW_MODEL={os.environ.get('CREW_MODEL')}, EXTRACTION_MODEL={os.environ.get('EXTRACTION_MODEL', 'unset')}")
        c = _reimport_crew_module()
        import safedeck.crew as cm
        print(f"DEBUG: cm.EXTRACTION_MODEL={cm.EXTRACTION_MODEL}, cm.DEFAULT_MODEL={cm.DEFAULT_MODEL}")
        # Check via the local var AND the module
        assert c.EXTRACTION_MODEL == "gemini/gemini-3.1-flash-lite-preview"
        assert cm.EXTRACTION_MODEL == "gemini/gemini-3.1-flash-lite-preview"

    def test_extraction_model_overrides_crew_model(self, monkeypatch):
        """EXTRACTION_MODEL wins over CREW_MODEL when both are set."""
        monkeypatch.setenv("CREW_MODEL", "gemini/gemini-3.1-flash-lite-preview")
        monkeypatch.setenv("EXTRACTION_MODEL", "gemini/gemini-2.5-flash")
        c = _reimport_crew_module()
        assert c.EXTRACTION_MODEL == "gemini/gemini-2.5-flash"
        assert c.DEFAULT_MODEL == "gemini/gemini-3.1-flash-lite-preview"


# ---------- agent assignment ----------

class TestAgentModelAssignment:
    """Verify the right model is wired to the right agent."""

    def test_extraction_agent_uses_extraction_model(self, monkeypatch):
        """agents[0] (extraction_specialist) uses EXTRACTION_MODEL."""
        monkeypatch.setenv("EXTRACTION_MODEL", "gemini/gemini-2.5-flash")
        monkeypatch.setenv("CREW_MODEL", "gemini/gemini-3.1-flash-lite-preview")
        # Re-import so env vars take effect
        c = _reimport_crew_module()

        crew = _build_crew()
        extraction_agent = crew.agents[0]
        llm_model = extraction_agent.llm.model if hasattr(extraction_agent.llm, "model") else str(extraction_agent.llm)
        assert "2.5-flash" in llm_model, f"Extraction agent should use 2.5-flash, got {llm_model}"

    def test_other_agents_use_default_model(self, monkeypatch):
        """agents[1..4] use DEFAULT_MODEL (which is CREW_MODEL)."""
        monkeypatch.setenv("EXTRACTION_MODEL", "gemini/gemini-2.5-flash")
        monkeypatch.setenv("CREW_MODEL", "gemini/gemini-3.1-flash-lite-preview")
        c = _reimport_crew_module()

        crew = _build_crew()
        for agent in crew.agents[1:]:
            llm_model = agent.llm.model if hasattr(agent.llm, "model") else str(agent.llm)
            assert "3.1-flash-lite-preview" in llm_model, \
                f"{agent.role} should use DEFAULT_MODEL, got {llm_model}"

    def test_extraction_and_default_are_different(self, monkeypatch):
        """When configured, extraction and risk/scoring agents use different models."""
        monkeypatch.setenv("EXTRACTION_MODEL", "gemini/gemini-2.5-flash")
        monkeypatch.setenv("CREW_MODEL", "gemini/gemini-3.1-flash-lite-preview")
        c = _reimport_crew_module()

        crew = _build_crew()
        extraction = crew.agents[0].llm
        risk = crew.agents[2].llm  # risk_analyst

        ext_model = extraction.model if hasattr(extraction, "model") else str(extraction)
        risk_model = risk.model if hasattr(risk, "model") else str(risk)

        assert ext_model != risk_model, "Extraction and risk agents should use different models in production"
