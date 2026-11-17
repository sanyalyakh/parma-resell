import click
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

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(_error):
        db.session.rollback()
        return jsonify({"error": {"code": "RESOURCE_CONFLICT", "message": "Конфликт данных или дублирующая запись", "details": {}}}), 409

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

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--first-name", prompt="First name")
    @click.option("--last-name", prompt="Last name")
    @click.password_option()
    def create_admin(email, first_name, last_name, password):
        """Create or promote an administrator account."""
        from werkzeug.security import generate_password_hash
        from app.models import Role, User

        normalized_email = email.strip().lower()
        if len(password) < 12:
            raise click.ClickException("Admin password must contain at least 12 characters.")
        user = User.query.filter_by(email=normalized_email).first()
        if not user:
            user = User(email=normalized_email, first_name=first_name,
                        last_name=last_name, password_hash=generate_password_hash(password))
            db.session.add(user)
        role = Role.query.filter_by(name="admin").first()
        if not role:
            role = Role(name="admin")
            db.session.add(role)
            db.session.flush()
        if not user.has_role("admin"):
            user.roles.append(role)
        db.session.commit()
        click.echo(f"Administrator ready: {normalized_email}")

    return app
