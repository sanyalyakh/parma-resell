import os

from app import create_app
from app.extensions import db
from app.models import Club, Listing, Match, Order, SeasonTicket, User


class TestConfig:
    TESTING = True
    SECRET_KEY = "demo-test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def test_demo_seed_idempotent_and_isolated(monkeypatch):
    monkeypatch.setenv("ALLOW_DEMO_SEED", "1")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "test-demo-password")
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        runner = app.test_cli_runner()
        assert runner.invoke(args=["seed-demo"]).exit_code == 0
        assert runner.invoke(args=["seed-demo"]).exit_code == 0
        assert db.session.query(Club).filter_by(slug="parma-demo").count() == 1
        assert db.session.query(Match).count() == 2
        assert db.session.query(SeasonTicket).count() == 2
        assert db.session.query(Listing).count() == 3
        assert db.session.query(Order).count() == 1
        buyer = db.session.query(User).filter_by(phone="+79990000001").one()
        assert db.session.query(SeasonTicket).filter_by(holder_id=buyer.id).count() == 1
        assert db.session.query(Order).filter_by(buyer_id=buyer.id).count() == 1
        login = app.test_client().post("/api/auth/login", json={
            "phone": "+79990000001", "password": "test-demo-password"
        })
        assert login.status_code == 200
        db.session.remove()
        db.drop_all()


def test_demo_seed_requires_opt_in(monkeypatch):
    monkeypatch.delenv("ALLOW_DEMO_SEED", raising=False)
    monkeypatch.setenv("DEMO_USER_PASSWORD", "test-demo-password")
    app = create_app(TestConfig)
    assert app.test_cli_runner().invoke(args=["seed-demo"]).exit_code != 0


def test_demo_catalog_available_seats(monkeypatch):
    monkeypatch.setenv("ALLOW_DEMO_SEED", "1")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "test-demo-password")
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        assert app.test_cli_runner().invoke(args=["seed-demo"]).exit_code == 0
        assert app.test_cli_runner().invoke(args=["seed-demo"]).exit_code == 0
        client = app.test_client()
        match = client.get("/api/matches").json["items"][0]
        base = "/api/matches/" + match["id"]
        seats = {s["number"]: s for s in client.get(base + "/seats").json["items"]}
        for number, price in (("12", 150000), ("13", 140000)):
            assert seats[number]["status"] == "available"
            assert seats[number]["listing_id"]
            assert seats[number]["price_kopecks"] == price
        for number in ("14", "15"):
            assert seats[number]["status"] == "unavailable"
            assert seats[number]["listing_id"] is None
        offers = client.get(base + "/listings").json["items"]
        assert len(offers) == 2
        by_seat = {offer["seat_id"]: offer for offer in offers}
        for seat in seats.values():
            if seat["status"] == "available":
                offer = by_seat[seat["id"]]
                assert seat["listing_id"] == offer["id"]
                assert seat["price_kopecks"] == offer["price_kopecks"]
            else:
                assert seat["listing_id"] is None
                assert seat["price_kopecks"] is None
        monkeypatch.delenv("ALLOW_DEMO_SEED")
        assert client.get(base + "/listings").json["items"] == []
        db.session.remove()
        db.drop_all()
