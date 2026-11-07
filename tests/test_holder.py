from datetime import datetime, timedelta, timezone

import pytest

from app import create_app
from app.extensions import db
from app.models import Club, Match, Seat, SeasonTicket, User, Venue


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
        club = Club(name="PARMA", slug="parma")
        user = User(email="holder@example.com", password_hash="unused", role="holder")
        db.session.add_all([club, user])
        db.session.flush()
        venue = Venue(club_id=club.id, name="Arena")
        db.session.add(venue)
        db.session.flush()
        seat = Seat(venue_id=venue.id, sector="A", row="1", number="1")
        match = Match(club_id=club.id, venue_id=venue.id, opponent="Guest",
                      starts_at=datetime.now(timezone.utc) + timedelta(days=7))
        db.session.add_all([seat, match])
        db.session.commit()
        from app.auth import serializer
        token = serializer().dumps(user.id)
        yield app.test_client(), {"Authorization": "Bearer " + token}, club.id, seat.id, match.id
        db.session.remove()
        db.drop_all()


def test_claim_requires_auth(context):
    client, _, _, _, _ = context
    assert client.post("/api/my/tickets", json={}).status_code == 401


def test_ticket_claim_remains_unverified(context):
    client, headers, club_id, seat_id, match_id = context
    claim = client.post("/api/my/tickets", headers=headers, json={
        "club_id": club_id, "seat_id": seat_id, "season": "2026/27",
        "provider_ticket_id": "external-1",
    })
    assert claim.status_code == 201
    assert claim.json["ticket"]["verification_status"] == "pending"
    listing = client.post("/api/my/listings", headers=headers, json={
        "season_ticket_id": claim.json["ticket"]["id"],
        "match_id": match_id, "price_kopecks": 10000,
    })
    assert listing.status_code == 409
    assert listing.json["error"] == "ticket_not_verified"


def test_verified_ticket_can_create_draft_only(context):
    client, headers, club_id, seat_id, match_id = context
    claim = client.post("/api/my/tickets", headers=headers, json={
        "club_id": club_id, "seat_id": seat_id, "season": "2026/27",
        "provider_ticket_id": "external-2",
    })
    with client.application.app_context():
        ticket = db.session.get(SeasonTicket, claim.json["ticket"]["id"])
        ticket.verification_status = "verified"  # Simulates future trusted provider adapter
        db.session.commit()
    payload = {"season_ticket_id": claim.json["ticket"]["id"],
               "match_id": match_id, "price_kopecks": 10000}
    listing = client.post("/api/my/listings", headers=headers, json=payload)
    assert listing.status_code == 201
    assert listing.json["listing"]["status"] == "draft"
    assert client.post("/api/my/listings", headers=headers, json=payload).status_code == 409
    withdrawn = client.post(
        "/api/my/listings/" + listing.json["listing"]["id"] + "/withdraw", headers=headers
    )
    assert withdrawn.status_code == 200
    assert withdrawn.json["listing"]["status"] == "withdrawn"
