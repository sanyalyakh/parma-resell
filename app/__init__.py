from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, migrate, limiter


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    if not app.config.get("TESTING") and app.config.get("APP_ENV") == "production":
        secret = app.config.get("SECRET_KEY")
        if not isinstance(secret, str) or len(secret) < 32 or secret == "dev-only-change-me":
            raise RuntimeError("Production requires a strong SECRET_KEY (at least 32 characters)")

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    from app import models  # noqa: F401
    from app.routes import bp as main_bp
    from app.auth import bp as auth_bp
    from app.catalog import bp as catalog_bp
    from app.holder import bp as holder_bp
    from app.reservations import bp as reservations_bp
    from app.admin import bp as admin_bp
    from app.ticket_admin import bp as ticket_admin_bp
    from app.api_meta import bp as api_meta_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(holder_bp)
    app.register_blueprint(reservations_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ticket_admin_bp)
    app.register_blueprint(api_meta_bp)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Cache-Control", "no-store")
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "parma-resell"})

    return app
