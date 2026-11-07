from datetime import datetime, timedelta, timezone

import pytest

from app import create_app
from app.extensions import db
from app.models import AuditEvent, Club, User, Venue


class TestConfig:
    TESTING = True
    SECRET_KEY = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def context():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        a = Club(name="PARMA", slug="parma")
        b = Club(name="Other", slug="other")
        db.session.add_all([a, b])
        db.session.flush()
        venue = Venue(club_id=a.id, name="Arena")
        admin = User(email="admin@example.com", password_hash="unused",
                     role="club_admin", club_id=a.id)
        buyer = User(email="buyer@example.com", password_hash="unused", role="buyer")
        db.session.add_all([venue, admin, buyer])
        db.session.commit()
        from app.auth import serializer
        tokens = {name: {"Authorization": "Bearer " + serializer().dumps(user.id)}
                  for name, user in (("admin", admin), ("buyer", buyer))}
        payload = {"club_id": a.id, "venue_id": venue.id, "opponent": "Guest",
                   "starts_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()}
        yield app.test_client(), tokens, payload, b.id
        db.session.remove()
        db.drop_all()


def test_admin_can_create_match_with_audit(context):
    client, tokens, payload, _ = context
    response = client.post("/api/admin/matches", headers=tokens["admin"], json=payload)
    assert response.status_code == 201
    assert response.json["match"]["opponent"] == "Guest"
    with client.application.app_context():
        assert AuditEvent.query.filter_by(action="match.created").count() == 1


def test_buyer_cannot_create_match(context):
    client, tokens, payload, _ = context
    assert client.post("/api/admin/matches", json=payload).status_code == 401
    assert client.post("/api/admin/matches", headers=tokens["buyer"], json=payload).status_code == 403


def test_club_admin_cannot_manage_other_club(context):
    client, tokens, payload, other_club_id = context
    payload["club_id"] = other_club_id
    assert client.post("/api/admin/matches", headers=tokens["admin"], json=payload).status_code == 403


def test_match_validation(context):
    client, tokens, payload, _ = context
    payload["starts_at"] = "2027-01-01T12:00:00"
    assert client.post("/api/admin/matches", headers=tokens["admin"], json=payload).status_code == 400
