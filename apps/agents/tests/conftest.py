"""Pytest config — make src/ importable without requiring `uv sync`.

This lets the test suite run against the source tree directly,
without building the wheel first.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
