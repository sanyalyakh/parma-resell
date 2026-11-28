"""Phone/password authentication; email is optional profile information."""
import re
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db, limiter
from app.models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def normalize_phone(value):
    """Normalize Russian phone formats to E.164; accept other E.164 numbers."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not re.fullmatch(r"[+\d\s()\-]+", value):
        return None
    digits = re.sub(r"\D", "", value)
    if len(digits) == 11 and digits[0] in "78":
        digits = "7" + digits[1:]
    if not 8 <= len(digits) <= 15:
        return None
    return "+" + digits


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
    return {"id": user.id, "phone": user.phone, "email": user.email,
            "first_name": user.first_name, "last_name": user.last_name,
            "role": user.role, "club_id": user.club_id}


@bp.post("/register")
@limiter.limit("5 per minute")
def register():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    phone = normalize_phone(payload.get("phone"))
    password = payload.get("password")
    email = payload.get("email")
    if email is not None:
        if not isinstance(email, str):
            return jsonify(error="invalid_email"), 400
        email = email.strip().lower() or None
        if email and (len(email) > 254 or len(email) < 3 or "@" not in email):
            return jsonify(error="invalid_email"), 400
    if phone is None or not isinstance(password, str) or not 8 <= len(password) <= 256:
        return jsonify(error="invalid_credentials"), 400
    first_name, last_name = payload.get("first_name"), payload.get("last_name")
    if not isinstance(first_name, str) or not 1 <= len(first_name.strip()) <= 80:
        return jsonify(error="invalid_first_name"), 400
    if not isinstance(last_name, str) or not 1 <= len(last_name.strip()) <= 80:
        return jsonify(error="invalid_last_name"), 400
    user = User(phone=phone, email=email,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                password_hash=generate_password_hash(password), role="buyer")
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="identity_already_registered"), 409
    return jsonify(user=public_user(user)), 201


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    phone = normalize_phone(payload.get("phone"))
    password = payload.get("password")
    if phone is None or not isinstance(password, str):
        return jsonify(error="invalid_credentials"), 401
    user = db.session.query(User).filter_by(phone=phone).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify(error="invalid_credentials"), 401
    return jsonify(access_token=serializer().dumps(user.id), token_type="Bearer", expires_in=3600), 200


@bp.get("/me")
@require_auth
def me():
    return jsonify(user=public_user(g.current_user)), 200


@bp.patch("/me")
@require_auth
def update_profile():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    # Phone changes must use a future SMS-verified flow, not a profile edit.
    if not payload or any(key not in ("first_name", "last_name", "email") for key in payload):
        return jsonify(error="unsupported_profile_field"), 400
    user = g.current_user
    for field in ("first_name", "last_name"):
        if field in payload:
            value = payload[field]
            if not isinstance(value, str) or len(value.strip()) > 80:
                return jsonify(error="invalid_profile"), 400
            setattr(user, field, value.strip() or None)
    if "email" in payload:
        value = payload["email"]
        if value is not None and not isinstance(value, str):
            return jsonify(error="invalid_email"), 400
        value = value.strip().lower() if value else None
        if value and (len(value) > 254 or len(value) < 3 or "@" not in value):
            return jsonify(error="invalid_email"), 400
        user.email = value
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="identity_already_registered"), 409
    return jsonify(user=public_user(user)), 200
