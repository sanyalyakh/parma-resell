"""MVP contract: account editing and read-only catalog."""
from datetime import datetime, timedelta, timezone

from app import create_app
from app.extensions import db
from app.models import Club, Match, Seat, Venue


class Config:
    TESTING = True
    SECRET_KEY = "mvp-test-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def test_register_profile_edit_and_reject_phone_change():
    app = create_app(Config)
    with app.app_context():
        db.create_all()
        client = app.test_client()
        registered = client.post("/api/auth/register", json={
            "phone": "+79998887766", "password": "example123",
            "first_name": "Иван", "last_name": "Петров"
        })
        assert registered.status_code == 201
        assert registered.json["user"]["first_name"] == "Иван"
        assert registered.json["user"]["email"] is None
        login = client.post("/api/auth/login", json={
            "phone": "+79998887766", "password": "example123"
        })
        assert login.status_code == 200
        headers = {"Authorization": "Bearer " + login.json["access_token"]}
        updated = client.patch("/api/auth/me", headers=headers, json={
            "first_name": "Алексей", "last_name": "Петров", "email": "a@example.org"
        })
        assert updated.status_code == 200
        assert updated.json["user"]["first_name"] == "Алексей"
        assert updated.json["user"]["email"] == "a@example.org"
        assert client.patch("/api/auth/me", headers=headers,
                            json={"phone": "+79990000000"}).status_code == 400
        assert client.get("/api/auth/me", headers=headers).json["user"]["phone"] == "+79998887766"
        db.session.remove()
        db.drop_all()


def test_public_match_detail_and_no_fake_sellable_offers():
    app = create_app(Config)
    with app.app_context():
        db.create_all()
        club = Club(name="БК ПАРМА", slug="parma-mvp", ticket_provider="mock")
        db.session.add(club)
        db.session.flush()
        venue = Venue(club_id=club.id, name="Тестовая арена")
        db.session.add(venue)
        db.session.flush()
        seat = Seat(venue_id=venue.id, sector="A", row="1", number="2")
        match = Match(club_id=club.id, venue_id=venue.id, opponent="Тестовый соперник",
                      starts_at=datetime.now(timezone.utc) + timedelta(days=10))
        db.session.add_all([seat, match])
        db.session.commit()
        client = app.test_client()
        catalog = client.get("/api/matches")
        assert catalog.status_code == 200
        assert catalog.json["items"][0]["home_club"]["name"] == "БК ПАРМА"
        assert catalog.json["pagination"]["total"] == 1
        assert client.get("/api/matches/" + match.id).json["arena"]["name"] == "Тестовая арена"
        assert client.get("/api/matches/" + match.id + "/listings").json["items"] == []
        seats = client.get("/api/matches/" + match.id + "/seats").json["items"]
        assert len(seats) == 1
        assert seats[0]["status"] == "unavailable"
        db.session.remove()
        db.drop_all()
