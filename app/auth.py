"""Token-based API authentication. Never allow self-assigned privileged roles."""
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="parma-resell-auth-v1")


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        scheme, _, token = header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            return jsonify(error="authentication_required"), 401
        try:
            user_id = serializer().loads(token, max_age=3600)
        except (BadSignature, SignatureExpired):
            return jsonify(error="invalid_or_expired_token"), 401
        user = db.session.get(User, user_id)
        if user is None:
            return jsonify(error="invalid_or_expired_token"), 401
        g.current_user = user
        return view(*args, **kwargs)
    return wrapped



def require_roles(*allowed_roles):
    """Enforce server-side RBAC after validating the signed access token."""
    def decorate(view):
        @wraps(view)
        @require_auth
        def wrapped(*args, **kwargs):
            if g.current_user.role not in allowed_roles:
                return jsonify(error="forbidden"), 403
            return view(*args, **kwargs)
        return wrapped
    return decorate


def public_user(user):
    return {"id": user.id, "email": user.email, "role": user.role, "club_id": user.club_id}


@bp.post("/register")
def register():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify(error="invalid_credentials"), 400
    email = email.strip().lower()
    if len(email) > 254 or len(email) < 3 or "@" not in email or len(password) < 12 or len(password) > 256:
        return jsonify(error="invalid_credentials"), 400
    user = User(email=email, password_hash=generate_password_hash(password), role="buyer")
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="email_already_registered"), 409
    return jsonify(user=public_user(user)), 201


@bp.post("/login")
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    email, password = payload.get("email"), payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify(error="invalid_credentials"), 401
    user = db.session.query(User).filter_by(email=email.strip().lower()).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify(error="invalid_credentials"), 401
    return jsonify(access_token=serializer().dumps(user.id), token_type="Bearer", expires_in=3600), 200


@bp.get("/me")
@require_auth
def me():
    return jsonify(user=public_user(g.current_user)), 200
