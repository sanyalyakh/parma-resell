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
