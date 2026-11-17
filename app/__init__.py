from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    from app import models  # noqa: F401
    from app.models import TokenBlocklist
    from app.routes import bp as main_bp
    app.register_blueprint(main_bp, url_prefix="/api/v1")

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(_header, payload):
        return db.session.get(TokenBlocklist, payload["jti"]) is not None

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": {"code": "AUTHENTICATION_REQUIRED", "message": reason, "details": {}}}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": {"code": "INVALID_TOKEN", "message": reason, "details": {}}}), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"error": {"code": "TOKEN_EXPIRED", "message": "Токен истёк", "details": {}}}), 401

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Ресурс не найден", "details": {}}}), 404

    @app.errorhandler(400)
    def bad_request(_error):
        return jsonify({"error": {"code": "BAD_REQUEST", "message": "Некорректный запрос", "details": {}}}), 400

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "parma-resell"})

    @app.get("/openapi.yaml")
    def openapi_spec():
        return send_from_directory(app.root_path + "/../docs", "openapi.yaml", mimetype="application/yaml")

    @app.get("/docs")
    def swagger_ui():
        return """<!doctype html><html><head><title>PARMA RESELL API</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
        <body><div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>SwaggerUIBundle({url:'/openapi.yaml',dom_id:'#swagger-ui'});</script>
        </body></html>"""

    return app
