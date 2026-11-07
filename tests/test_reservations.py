import pytest

from app import create_app
from app.extensions import db
from app.models import User


class TestConfig:
    TESTING = True
    SECRET_KEY = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        user = User(email="buyer@example.com", password_hash="unused")
        db.session.add(user)
        db.session.commit()
        from app.auth import serializer
        token = serializer().dumps(user.id)
        yield app.test_client(), {"Authorization": "Bearer " + token}
        db.session.remove()
        db.drop_all()


def test_reservation_requires_auth(client):
    http, _ = client
    assert http.post("/api/listings/some-listing/reserve").status_code == 401


def test_reservation_fails_closed(client):
    http, headers = client
    response = http.post("/api/listings/some-listing/reserve", headers=headers)
    assert response.status_code == 503
    assert response.json["error"] == "ticket_provider_not_connected"
    from app.models import Order
    assert Order.query.count() == 0
