"""One-time schema bootstrap for local development only.

Production deployments must use versioned Alembic migrations instead.
"""
import os

from app import create_app
from app.extensions import db


def main():
    if os.environ.get("ALLOW_DEV_DB_BOOTSTRAP") != "1":
        raise SystemExit("Refusing schema bootstrap without ALLOW_DEV_DB_BOOTSTRAP=1")
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Development database tables created")


if __name__ == "__main__":
    main()
