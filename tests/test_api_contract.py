from app import create_app
from app.api_contract import API_CONTRACT


class TestConfig:
    TESTING = True
    SECRET_KEY = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def test_api_meta_exposes_disabled_payment_features():
    app = create_app(TestConfig)
    response = app.test_client().get("/api/meta")
    assert response.status_code == 200
    features = response.json["features"]
    assert features["payments"] is False
    assert features["reservations"] is False
    assert features["ticket_verification"] is False


def test_frontend_contract_paths_exist():
    app = create_app(TestConfig)
    rules = {(rule.rule, method) for rule in app.url_map.iter_rules()
             for method in rule.methods}
    for category in ("public", "holder", "club_admin", "disabled"):
        for endpoint in API_CONTRACT[category]:
            method, path = endpoint.split(" ", 1)
            path = path.split("?", 1)[0]
            assert (path, method) in rules, endpoint
