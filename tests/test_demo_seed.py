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


def test_demo_purchase_flow(monkeypatch):
    monkeypatch.setenv("ALLOW_DEMO_SEED", "1")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "test-demo-password")
    app = create_app(TestConfig)
    app.config["APP_ENV"] = "development"
    with app.app_context():
        db.create_all()
        assert app.test_cli_runner().invoke(args=["seed-demo"]).exit_code == 0
        client = app.test_client()
        login = client.post("/api/auth/login", json={"phone": "+79990000001", "password": "test-demo-password"})
        headers = {"Authorization": "Bearer " + login.json["access_token"]}
        match = client.get("/api/matches").json["items"][0]
        url = "/api/matches/" + match["id"] + "/seats"
        seats = {s["number"]: s for s in client.get(url).json["items"]}
        assert seats["12"]["status"] == seats["13"]["status"] == "available"
        assert seats["14"]["status"] == seats["15"]["status"] == "unavailable"
        assert seats["13"]["price_kopecks"] == 140000
        assert len(client.get("/api/matches/" + match["id"] + "/listings").json["items"]) == 2
        own = "/api/listings/" + seats["12"]["listing_id"] + "/reserve"
        assert client.post(own, headers=headers).status_code == 409
        reserve = "/api/listings/" + seats["13"]["listing_id"] + "/reserve"
        response = client.post(reserve, headers=headers)
        assert response.status_code == 201
        order_id = response.json["order"]["id"]
        assert client.post(reserve, headers=headers).status_code == 409
        assert next(s for s in client.get(url).json["items"] if s["number"] == "13")["status"] == "reserved"
        confirm = "/api/orders/" + order_id + "/demo-confirm"
        assert client.post(confirm, headers=headers).status_code == 200
        assert client.post(confirm, headers=headers).status_code == 200
        assert next(s for s in client.get(url).json["items"] if s["number"] == "13")["status"] == "sold"
        assert any(o["id"] == order_id and o["status"] == "completed" for o in client.get("/api/my/orders", headers=headers).json["items"])
        assert app.test_cli_runner().invoke(args=["seed-demo"]).exit_code == 0
        assert next(s for s in client.get(url).json["items"] if s["number"] == "13")["status"] == "sold"
        db.session.remove()
        db.drop_all()
