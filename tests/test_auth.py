import pytest

from app import create_app
from app.extensions import db


class TestConfig:
    TESTING = True
    SECRET_KEY = "test-secret-not-for-production"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_register_login_and_me(client):
    response = client.post("/api/auth/register", json={
        "email": "USER@example.com", "password": "strong-test-password", "role": "platform_admin"
    })
    assert response.status_code == 201
    assert response.json["user"]["role"] == "buyer"
    assert response.json["user"]["email"] == "user@example.com"
    login = client.post("/api/auth/login", json={
        "email": "user@example.com", "password": "strong-test-password"
    })
    assert login.status_code == 200
    profile = client.get("/api/auth/me", headers={
        "Authorization": "Bearer " + login.json["access_token"]
    })
    assert profile.status_code == 200
    assert profile.json["user"]["email"] == "user@example.com"


def test_duplicate_email_and_weak_password(client):
    data = {"email": "user@example.com", "password": "strong-test-password"}
    assert client.post("/api/auth/register", json=data).status_code == 201
    assert client.post("/api/auth/register", json=data).status_code == 409
    assert client.post("/api/auth/register", json={"email": "x@y.com", "password": "weak"}).status_code == 400


def test_auth_rejects_invalid_credentials(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "missing@example.com", "password": "wrong"}).status_code == 401


def test_role_guard_blocks_unprivileged_user(client):
    from app.auth import require_roles

    @client.application.get("/api/test/admin-only")
    @require_roles("club_admin", "platform_admin")
    def admin_only():
        return {"ok": True}

    data = {"email": "user@example.com", "password": "strong-test-password"}
    assert client.post("/api/auth/register", json=data).status_code == 201
    token = client.post("/api/auth/login", json=data).json["access_token"]
    assert client.get("/api/test/admin-only").status_code == 401
    response = client.get("/api/test/admin-only", headers={"Authorization": "Bearer " + token})
    assert response.status_code == 403
    assert response.json["error"] == "forbidden"
