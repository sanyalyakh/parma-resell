from flask import Blueprint, jsonify

bp = Blueprint("main", __name__)


@bp.get("/")
def index():
    return jsonify({
        "name": "PARMA RESELL",
        "message": "Backend is running",
        "version": "0.1.0",
    })
