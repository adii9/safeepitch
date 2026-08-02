"""Smoke tests — verify the package imports and the version is set."""

import sys
from pathlib import Path

# Add src to path so tests can run without `uv sync` being complete
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import pytest


def test_package_imports():
    """The package itself imports without crewai."""
    import safedeck

    assert safedeck.__version__ == "0.2.0"


def test_models_imports():
    """models.py has no crewai dependency — should always import."""
    from safedeck import models  # noqa: F401


def test_crew_module_imports():
    """crew.py requires crewai. Skip if not installed."""
    pytest.importorskip("crewai")
    from safedeck import crew  # noqa: F401


def test_flow_module_imports():
    """flow.py requires crewai. Skip if not installed."""
    pytest.importorskip("crewai")
    from safedeck import flow  # noqa: F401
