"""PostgreSQL-only integration tests (run with TEST_POSTGRES_URL)."""
import os
from pathlib import Path

import pytest
from flask_migrate import upgrade
from sqlalchemy import inspect, select

from app import create_app
from app.extensions import db
from app.models import Club, User


@pytest.mark.skipif(not os.getenv("TEST_POSTGRES_URL"), reason="PostgreSQL test database not configured")
def test_postgresql_migration_and_row_lock():
    class PgConfig:
        TESTING = True
        SECRET_KEY = "test"
        SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_POSTGRES_URL")
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    app = create_app(PgConfig)
    migrations_dir = str(Path(__file__).resolve().parents[1] / "migrations")
    with app.app_context():
        assert db.engine.dialect.name == "postgresql"
        upgrade(directory=migrations_dir)
        assert {"clubs", "users", "listings", "orders"} <= set(inspect(db.engine).get_table_names())
        with db.session.begin():
            club = Club(name="Integration Test", slug="integration-test")
            db.session.add(club)
        with db.session.begin():
            locked = db.session.scalar(
                select(Club).where(Club.slug == "integration-test").with_for_update()
            )
            assert locked is not None
            assert locked.name == "Integration Test"
        with db.session.begin():
            db.session.delete(db.session.scalar(select(Club).where(Club.slug == "integration-test")))
