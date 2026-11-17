from app import create_app
from datetime import datetime, timedelta, timezone

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Arena, Club, Match, Role, Seat, SeasonTicket, User


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



def test_listing_order_and_payment_lifecycle():
    app, client = make_client()
    with app.app_context():
        buyer_role = Role(name="buyer")
        seller_role = Role(name="seller")
        seller = User(email="seller@example.com", first_name="Seller", last_name="One",
                      password_hash=generate_password_hash("seller-password"),
                      roles=[buyer_role, seller_role])
        buyer = User(email="buyer@example.com", first_name="Buyer", last_name="Two",
                     password_hash=generate_password_hash("buyer-password"),
                     roles=[buyer_role])
        arena = Arena(name="Test Arena", city="Perm", capacity=100)
        db.session.add_all([seller, buyer, arena])
        db.session.flush()
        home, away = Club(name="PARMA"), Club(name="Opponent")
        db.session.add_all([home, away])
        db.session.flush()
        seat = Seat(arena_id=arena.id, sector="A", row="1", number="1")
        db.session.add(seat)
        db.session.flush()
        match = Match(home_club_id=home.id, away_club_id=away.id, arena_id=arena.id,
                      starts_at=datetime.now(timezone.utc) + timedelta(days=2),
                      competition="VTB United League", match_type="home", status="scheduled")
        db.session.add(match)
        db.session.flush()
        ticket = SeasonTicket(owner_id=seller.id, seat_id=seat.id, status="verified")
        db.session.add(ticket)
        db.session.commit()
        seller_id, buyer_id, match_id, seat_id, ticket_id = seller.id, buyer.id, match.id, seat.id, ticket.id
        seller_token = create_access_token(identity=str(seller_id), additional_claims={"roles": ["buyer", "seller"]})
        buyer_token = create_access_token(identity=str(buyer_id), additional_claims={"roles": ["buyer"]})

    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    listing_response = client.post("/api/v1/listings", headers=seller_headers, json={
        "match_id": match_id, "seat_id": seat_id, "season_ticket_id": ticket_id, "price": 1500,
    })
    assert listing_response.status_code == 201
    listing_id = listing_response.get_json()["listing"]["id"]

    failed_order = client.post("/api/v1/orders", headers=buyer_headers, json={"listing_id": listing_id})
    assert failed_order.status_code == 201
    failed_order_id = failed_order.get_json()["order"]["id"]
    failed_payment = client.post(
        f"/api/v1/orders/{failed_order_id}/payment/test",
        headers=buyer_headers, json={"outcome": "failed"},
    )
    assert failed_payment.status_code == 200
    assert failed_payment.get_json()["order"]["status"] == "payment_failed"

    successful_order = client.post("/api/v1/orders", headers=buyer_headers, json={"listing_id": listing_id})
    assert successful_order.status_code == 201
    successful_order_id = successful_order.get_json()["order"]["id"]
    successful_payment = client.post(
        f"/api/v1/orders/{successful_order_id}/payment/test",
        headers=buyer_headers, json={"outcome": "succeeded"},
    )
    assert successful_payment.status_code == 200
    assert successful_payment.get_json()["order"]["status"] == "paid"

    seat_map = client.get(f"/api/v1/matches/{match_id}/seats")
    assert seat_map.status_code == 200
    assert seat_map.get_json()["items"][0]["status"] == "sold"
    with app.app_context():
        db.drop_all()
