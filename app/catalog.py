"""Public read-only catalog endpoints."""
from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import Club, Match

bp = Blueprint("catalog", __name__, url_prefix="/api")


def serialize_match(m):
    return {
        "id": m.id, "club_id": m.club_id, "venue_id": m.venue_id,
        "opponent": m.opponent, "starts_at": m.starts_at.isoformat(),
        "status": m.status,
    }


@bp.get("/clubs")
def clubs():
    records = db.session.scalars(select(Club).order_by(Club.name, Club.id)).all()
    return jsonify(items=[{"id": c.id, "name": c.name, "slug": c.slug} for c in records])


@bp.get("/matches")
def matches():
    club_id = request.args.get("club_id")
    if club_id is not None and (not club_id or len(club_id) > 36):
        return jsonify(error="invalid_club_id"), 400
    try:
        limit = int(request.args.get("limit", "20"))
        offset = int(request.args.get("offset", "0"))
    except ValueError:
        return jsonify(error="invalid_pagination"), 400
    if not 1 <= limit <= 100 or offset < 0:
        return jsonify(error="invalid_pagination"), 400
    query = select(Match).where(Match.status == "scheduled")
    if club_id:
        query = query.where(Match.club_id == club_id)
    records = db.session.scalars(query.order_by(Match.starts_at, Match.id).limit(limit).offset(offset)).all()
    return jsonify(items=[serialize_match(m) for m in records], limit=limit, offset=offset)


@bp.get("/matches/<uuid:match_id>")
def match_detail(match_id):
    match = db.session.get(Match, str(match_id))
    if match is None:
        return jsonify(error="match_not_found"), 404
    return jsonify(serialize_match(match))
