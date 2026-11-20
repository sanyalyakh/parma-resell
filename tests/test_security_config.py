import pytest

from app import create_app


def test_production_rejects_default_secret():
    class UnsafeConfig:
        APP_ENV = "production"
        SECRET_KEY = "dev-only-change-me"
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    with pytest.raises(RuntimeError, match="strong SECRET_KEY"):
        create_app(UnsafeConfig)


def test_security_headers_are_present():
    class TestConfig:
        TESTING = True
        SECRET_KEY = "test"
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    response = create_app(TestConfig).test_client().get("/api/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cache-Control"] == "no-store"
