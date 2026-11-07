import pytest

from app import create_app


def test_login_rate_limit():
    class TestConfig:
        TESTING = True
        SECRET_KEY = "test"
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        RATELIMIT_STORAGE_URI = "memory://"

    app = create_app(TestConfig)
    client = app.test_client()
    for _ in range(10):
        assert client.post("/api/auth/login", json={}).status_code == 401
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 429


def test_production_requires_distributed_limiter():
    class ProductionConfig:
        APP_ENV = "production"
        SECRET_KEY = "a" * 64
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        RATELIMIT_STORAGE_URI = "memory://"

    with pytest.raises(RuntimeError, match="Redis-backed"):
        create_app(ProductionConfig)
