"""Smoke tests — verify the package imports and the version is set."""


def test_package_imports():
    import safedeck

    assert safedeck.__version__ == "0.2.0"


def test_module_imports():
    """Each module should be importable without crashing."""
    from safedeck import agents, tasks  # noqa: F401
