from datetime import datetime, timezone
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.models import User, Role, Arena, Seat, SeasonTicket
from tests.test_api_contract import make_client, TestConfig


class TicketConfig(TestConfig):
    PHONE_CODE_TEST_MODE = True
    PHONE_CODE_PEPPER = "test-pepper"
    PHONE_CODE_TTL_MINUTES = 5
    PHONE_CODE_MAX_ATTEMPTS = 5
    TICKET_PROVIDER = "import"


def test_phone_sync_multiple_tickets_and_isolation():
    from app import create_app
    app = create_app(TicketConfig)
    client = app.test_client()
    with app.app_context():
        db.create_all()
        role = Role(name="buyer")
        user = User(email="tickets@example.com", first_name="A", last_name="B",
                    password_hash=generate_password_hash("password12345"), roles=[role])
        other = User(email="other@example.com", first_name="C", last_name="D",
                     password_hash=generate_password_hash("password12345"), roles=[role])
        arena = Arena(name="Arena", city="Perm")
        db.session.add_all([user, other, arena])
        db.session.flush()
        seats = [Seat(arena_id=arena.id, sector="A", row="1", number=str(i)) for i in (1, 2)]
        db.session.add_all(seats)
        db.session.commit()
        user_token = create_access_token(identity=str(user.id))
        other_token = create_access_token(identity=str(other.id))
        seat_ids = [s.id for s in seats]
    admin_role = None
    with app.app_context():
        admin_role = Role(name="admin")
        admin = User(email="admin@example.com", first_name="Admin", last_name="A",
                     password_hash=generate_password_hash("password12345"), roles=[admin_role])
        db.session.add(admin)
        db.session.commit()
        admin_token = create_access_token(identity=str(admin.id))
    headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    for i, seat_id in enumerate(seat_ids):
        response = client.post("/api/v1/admin/ticket-source-records", headers=admin_headers, json={
            "phone": "+79990001122", "external_id": f"source-{i}",
            "number": f"AB-{i}", "seat_id": seat_id, "season": "2026/27"})
        assert response.status_code == 201
    start = client.post("/api/v1/auth/phone/send-code", headers=headers, json={"phone": "+79990001122"})
    assert start.status_code == 202
    verified = client.post("/api/v1/auth/phone/verify", headers=headers,
                           json={"phone": "+79990001122", "code": start.json["test_code"]})
    assert verified.status_code == 200
    assert verified.json["sync"]["count"] == 2
    listing = client.get("/api/v1/seller/season-tickets", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json["items"]) == 2
    assert all(t["status"] == "pending" for t in listing.json["items"])
    outsider = client.get("/api/v1/seller/season-tickets",
                         headers={"Authorization": f"Bearer {other_token}"})
    assert outsider.json["items"] == []
    detail = client.get(f"/api/v1/seller/season-tickets/{listing.json['items'][0]['id']}",
                        headers={"Authorization": f"Bearer {other_token}"})
    assert detail.status_code == 404
    with app.app_context():
        db.drop_all()
