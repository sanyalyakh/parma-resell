"""Club-scoped administrative endpoints."""
from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.auth import require_roles
from app.extensions import db
from app.models import AuditEvent, Club, Match, Venue

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.post("/matches")
@require_roles("club_admin", "platform_admin")
def create_match():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="invalid_json"), 400
    club_id = payload.get("club_id")
    venue_id = payload.get("venue_id")
    opponent = payload.get("opponent")
    raw_start = payload.get("starts_at")
    if not all(isinstance(value, str) and value.strip() for value in
               (club_id, venue_id, opponent, raw_start)):
        return jsonify(error="invalid_match"), 400
    if len(club_id) > 36 or len(venue_id) > 36 or len(opponent) > 200:
        return jsonify(error="invalid_match"), 400
    if g.current_user.role == "club_admin" and g.current_user.club_id != club_id:
        return jsonify(error="forbidden"), 403
    club = db.session.get(Club, club_id)
    venue = db.session.get(Venue, venue_id)
    if club is None or venue is None or venue.club_id != club_id:
        return jsonify(error="invalid_club_or_venue"), 404
    try:
        starts_at = datetime.fromisoformat(raw_start.replace("Z", "+00:00"))
    except ValueError:
        return jsonify(error="invalid_start_time"), 400
    if starts_at.tzinfo is None or starts_at.utcoffset() is None:
        return jsonify(error="timezone_required"), 400
    if starts_at.astimezone(timezone.utc) <= datetime.now(timezone.utc):
        return jsonify(error="match_must_be_future"), 400
    match = Match(club_id=club_id, venue_id=venue_id, opponent=opponent.strip(),
                  starts_at=starts_at.astimezone(timezone.utc), status="scheduled")
    db.session.add(match)
    db.session.flush()
    db.session.add(AuditEvent(actor_id=g.current_user.id, entity_type="match",
                              entity_id=match.id, action="match.created",
                              details={"club_id": club_id}))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="match_creation_conflict"), 409
    return jsonify(match={"id": match.id, "club_id": match.club_id,
                          "venue_id": match.venue_id, "opponent": match.opponent,
                          "starts_at": match.starts_at.isoformat(),
                          "status": match.status}), 201
