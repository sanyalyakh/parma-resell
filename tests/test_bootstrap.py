from pathlib import Path


def test_bootstrap_requires_explicit_opt_in(monkeypatch):
    import pytest
    from scripts.bootstrap_db import main

    monkeypatch.delenv("ALLOW_DEV_DB_BOOTSTRAP", raising=False)
    with pytest.raises(SystemExit, match="Refusing schema bootstrap"):
        main()


def test_bootstrap_script_is_not_an_automatic_production_migration():
    source = Path("scripts/bootstrap_db.py").read_text()
    assert 'ALLOW_DEV_DB_BOOTSTRAP' in source
    assert "db.create_all()" in source
