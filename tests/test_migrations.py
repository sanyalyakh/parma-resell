"""Smoke-test the committed baseline migration on a fresh database."""
from pathlib import Path

from flask_migrate import upgrade
from sqlalchemy import inspect

from app import create_app
from app.extensions import db


def test_initial_migration_creates_all_domain_tables(tmp_path):
    database = tmp_path / "migration-smoke.db"

    class TestConfig:
        TESTING = True
        SECRET_KEY = "test"
        SQLALCHEMY_DATABASE_URI = "sqlite:///" + str(database)
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    app = create_app(TestConfig)
    migrations_dir = str(Path(__file__).resolve().parents[1] / "migrations")
    with app.app_context():
        upgrade(directory=migrations_dir)
        tables = set(inspect(db.engine).get_table_names())
        assert {"alembic_version", "clubs", "users", "venues", "seats",
                "matches", "season_tickets", "listings", "orders",
                "audit_events"} <= tables
        upgrade(directory=migrations_dir)  # Reapplying the latest revision is safe.
