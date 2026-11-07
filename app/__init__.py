from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models  # noqa: F401
    from app.routes import bp as main_bp
    from app.auth import bp as auth_bp
    from app.catalog import bp as catalog_bp
    from app.holder import bp as holder_bp
    from app.reservations import bp as reservations_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(holder_bp)
    app.register_blueprint(reservations_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "parma-resell"})

    return app
