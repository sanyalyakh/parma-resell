from datetime import datetime, timezone

import pytest

from app import create_app
from app.extensions import db
from app.models import Club, Match, Venue


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
        club = Club(name="PARMA", slug="parma")
        db.session.add(club)
        db.session.flush()
        venue = Venue(club_id=club.id, name="Arena")
        db.session.add(venue)
        db.session.flush()
        db.session.add(Match(club_id=club.id, venue_id=venue.id, opponent="Visitors", starts_at=datetime(2027, 1, 1, tzinfo=timezone.utc)))
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_clubs_and_matches(client):
    clubs = client.get("/api/clubs")
    assert clubs.status_code == 200
    assert clubs.json["items"][0]["slug"] == "parma"
    matches = client.get("/api/matches")
    assert matches.status_code == 200
    assert matches.json["items"][0]["opponent"] == "Visitors"


def test_invalid_pagination(client):
    assert client.get("/api/matches?limit=10000").status_code == 400
    assert client.get("/api/matches?offset=-1").status_code == 400
    assert client.get("/api/matches?limit=abc").status_code == 400


def test_match_card_contract_and_pagination(client):
    response = client.get("/api/matches?limit=1&offset=0")
    assert response.status_code == 200
    body = response.get_json()
    assert body["limit"] == 1
    assert body["offset"] == 0
    assert body["pagination"]["total"] == 1
    match = body["items"][0]
    assert match["home_club"]["name"] == "PARMA"
    assert match["away_club"] == {"id": None, "name": "Visitors"}
    assert match["arena"]["name"] == "Arena"
    assert "city" in match["arena"]
    assert "competition" in match
    assert match["opponent"] == "Visitors"
    assert match["club_id"] == match["home_club"]["id"]
    assert match["venue_id"] == match["arena"]["id"]
    assert client.get("/api/matches?limit=1&offset=1").get_json()["items"] == []


def test_unpublished_inventory_is_unavailable(client):
    match = client.get("/api/matches").json["items"][0]
    from app.models import Seat
    db.session.add(Seat(venue_id=match["venue_id"], sector="A", row="1", number="12"))
    db.session.commit()
    seats = client.get(f"/api/matches/{match['id']}/seats").json["items"]
    assert len(seats) == 1
    assert seats[0]["status"] == "unavailable"
    assert seats[0]["listing_id"] is None
    assert seats[0]["price_kopecks"] is None
    assert client.get(f"/api/matches/{match['id']}/listings").json["items"] == []
