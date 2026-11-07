from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import Club, Listing, Match, Seat, SeasonTicket, User, Venue


class TestConfig:
    TESTING = True
    SECRET_KEY = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def app():
    application = create_app(TestConfig)
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


def test_schema_creates_all_domain_tables(app):
    with app.app_context():
        assert {"clubs", "users", "venues", "seats", "matches", "season_tickets", "listings", "orders", "audit_events"}.issubset(db.metadata.tables)


def test_prevents_duplicate_seat(app):
    with app.app_context():
        club = Club(name="PARMA", slug="parma")
        db.session.add(club)
        db.session.flush()
        venue = Venue(club_id=club.id, name="Arena")
        db.session.add(venue)
        db.session.flush()
        db.session.add_all([
            Seat(venue_id=venue.id, sector="A", row="1", number="10"),
            Seat(venue_id=venue.id, sector="A", row="1", number="10"),
        ])
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()


def test_listing_price_must_be_positive(app):
    with app.app_context():
        club = Club(name="PARMA", slug="parma")
        db.session.add(club)
        db.session.flush()
        venue = Venue(club_id=club.id, name="Arena")
        user = User(email="holder@example.com", password_hash="hashed", role="holder")
        db.session.add_all([venue, user])
        db.session.flush()
        seat = Seat(venue_id=venue.id, sector="A", row="1", number="10")
        match = Match(club_id=club.id, venue_id=venue.id, opponent="Opponent", starts_at=datetime.now(timezone.utc))
        db.session.add_all([seat, match])
        db.session.flush()
        ticket = SeasonTicket(holder_id=user.id, club_id=club.id, seat_id=seat.id, season="2026/27", provider_ticket_id="provider-1")
        db.session.add(ticket)
        db.session.flush()
        db.session.add(Listing(season_ticket_id=ticket.id, match_id=match.id, price_kopecks=0))
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()
