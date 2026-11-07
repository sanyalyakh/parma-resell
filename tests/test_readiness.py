from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app import create_app
from app.extensions import db


class TestConfig:
    TESTING = True
    SECRET_KEY = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def test_readiness_succeeds_with_database():
    app = create_app(TestConfig)
    response = app.test_client().get("/api/ready")
    assert response.status_code == 200
    assert response.json == {"status": "ready", "dependency": "database"}


def test_readiness_fails_closed_on_database_error(monkeypatch):
    app = create_app(TestConfig)
    with app.app_context():
        def fail(*args, **kwargs):
            raise OperationalError("SELECT 1", {}, Exception("database down"))

        monkeypatch.setattr(db.session, "execute", fail)
        response = app.test_client().get("/api/ready")
        assert response.status_code == 503
        assert response.json == {"status": "unavailable", "dependency": "database"}
