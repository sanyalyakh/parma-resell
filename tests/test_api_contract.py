from app import create_app
from app.extensions import db


class TestConfig:
    TESTING = True
    SECRET_KEY = "test-secret"
    JWT_SECRET_KEY = "test-jwt-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_CSRF_PROTECT = False
    CORS_ORIGINS = ["http://localhost:3000"]
    PAYMENT_TEST_MODE = True
    LISTING_RESERVATION_MINUTES = 10


def make_client():
    app = create_app(TestConfig)
    app.config.update(TESTING=True)
    with app.app_context():
        db.create_all()
    return app, app.test_client()


def test_health_and_api_root():
    app, client = make_client()
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/v1/").get_json()["name"] == "PARMA RESELL"
    with app.app_context():
        db.drop_all()


def test_register_and_me():
    app, client = make_client()
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "password": "strong-password",
        "first_name": "Test", "last_name": "User",
    })
    assert response.status_code == 201
    token = response.get_json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.get_json()["user"]["roles"] == ["buyer"]
    with app.app_context():
        db.drop_all()


def test_register_validation():
    app, client = make_client()
    response = client.post("/api/v1/auth/register", json={"email": "bad", "password": "123"})
    assert response.status_code == 422
    with app.app_context():
        db.drop_all()
