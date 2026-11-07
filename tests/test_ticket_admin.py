import pytest

from app import create_app
from app.extensions import db
from app.models import AuditEvent, Club, Seat, SeasonTicket, User, Venue


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
        other = Club(name="Other", slug="other")
        db.session.add_all([club, other])
        db.session.flush()
        venue = Venue(club_id=club.id, name="Arena")
        db.session.add(venue)
        db.session.flush()
        seat = Seat(venue_id=venue.id, sector="A", row="1", number="1")
        holder = User(email="holder@example.com", password_hash="unused")
        admin = User(email="admin@example.com", password_hash="unused",
                     role="club_admin", club_id=club.id)
        foreign_admin = User(email="other@example.com", password_hash="unused",
                             role="club_admin", club_id=other.id)
        db.session.add_all([seat, holder, admin, foreign_admin])
        db.session.flush()
        ticket = SeasonTicket(holder_id=holder.id, club_id=club.id, seat_id=seat.id,
                              season="2026/27", provider_ticket_id="provider-1")
        db.session.add(ticket)
        db.session.commit()
        from app.auth import serializer
        headers = {key: {"Authorization": "Bearer " + serializer().dumps(user.id)}
                   for key, user in (("admin", admin), ("foreign", foreign_admin), ("holder", holder))}
        yield app.test_client(), headers, ticket.id
        db.session.remove()
        db.drop_all()


def test_admin_can_review_and_reject(context):
    client, headers, ticket_id = context
    response = client.get("/api/admin/ticket-claims", headers=headers["admin"])
    assert response.status_code == 200
    assert len(response.json["items"]) == 1
    result = client.post("/api/admin/ticket-claims/" + ticket_id + "/reject",
                         headers=headers["admin"], json={"reason": "Ownership not established"})
    assert result.status_code == 200
    assert result.json["ticket"]["verification_status"] == "rejected"
    with client.application.app_context():
        assert AuditEvent.query.filter_by(action="ticket_claim.rejected").count() == 1


def test_provider_verification_is_disabled(context):
    client, headers, ticket_id = context
    result = client.post("/api/admin/ticket-claims/" + ticket_id + "/verify",
                         headers=headers["admin"])
    assert result.status_code == 503
    with client.application.app_context():
        assert db.session.get(SeasonTicket, ticket_id).verification_status == "pending"


def test_cross_club_access_is_denied(context):
    client, headers, ticket_id = context
    assert client.get("/api/admin/ticket-claims", headers=headers["foreign"]).json["items"] == []
    assert client.post("/api/admin/ticket-claims/" + ticket_id + "/reject",
                       headers=headers["foreign"], json={"reason": "No access"}).status_code == 404
    assert client.get("/api/admin/ticket-claims", headers=headers["holder"]).status_code == 403
