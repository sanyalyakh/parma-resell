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


def test_register_login_and_me_without_email(client):
    payload = {"phone": "8 (999) 123-45-67", "password": "strong-password", "role": "platform_admin"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json["user"]["role"] == "buyer"
    assert response.json["user"]["phone"] == "+79991234567"
    assert response.json["user"]["email"] is None
    login = client.post("/api/auth/login", json={"phone": "+7 999 123 45 67", "password": "strong-password"})
    assert login.status_code == 200
    profile = client.get("/api/auth/me", headers={"Authorization": "Bearer " + login.json["access_token"]})
    assert profile.status_code == 200
    assert profile.json["user"]["phone"] == "+79991234567"


def test_optional_email_and_duplicate_phone(client):
    payload = {"phone": "+79991234568", "email": "USER@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).json["user"]["email"] == "user@example.com"
    assert client.post("/api/auth/register", json=payload).status_code == 409
    assert client.post("/api/auth/register", json={"phone": "+79991234569", "password": "weak"}).status_code == 400


def test_auth_rejects_invalid_credentials(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.post("/api/auth/login", json={"phone": "+79991234560", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "user@example.com", "password": "wrong"}).status_code == 401


def test_role_guard_blocks_unprivileged_user(client):
    from app.auth import require_roles

    @client.application.get("/api/test/admin-only")
    @require_roles("club_admin", "platform_admin")
    def admin_only():
        return {"ok": True}

    data = {"phone": "+79991234570", "password": "strong-password"}
    assert client.post("/api/auth/register", json=data).status_code == 201
    token = client.post("/api/auth/login", json=data).json["access_token"]
    assert client.get("/api/test/admin-only").status_code == 401
    response = client.get("/api/test/admin-only", headers={"Authorization": "Bearer " + token})
    assert response.status_code == 403
