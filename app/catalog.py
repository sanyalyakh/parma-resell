"""Public read-only match catalog. Never expose unpublished ticket offers."""
from flask import Blueprint, jsonify, request
from sqlalchemy import func, select

from app.extensions import db
from app.models import Club, Match, Venue, Seat, Listing, SeasonTicket

bp = Blueprint("catalog", __name__, url_prefix="/api")


def serialize_match(match):
    club = db.session.get(Club, match.club_id)
    venue = db.session.get(Venue, match.venue_id)
    return {
        "id": match.id, "club_id": match.club_id, "venue_id": match.venue_id,
        "opponent": match.opponent, "starts_at": match.starts_at.isoformat(),
        "status": "finished" if match.status == "completed" else match.status,
        "home_club": {"id": club.id, "name": club.name},
        "away_club": {"id": None, "name": match.opponent},
        "arena": {"id": venue.id, "name": venue.name, "city": "Пермь"},
        "competition": "Демонстрационный каталог" if club.ticket_provider == "mock" else "Баскетбол",
        "match_type": "home",
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
    total = db.session.scalar(select(func.count()).select_from(query.subquery()))
    records = db.session.scalars(query.order_by(Match.starts_at, Match.id).limit(limit).offset(offset)).all()
    return jsonify(items=[serialize_match(m) for m in records], limit=limit, offset=offset,
                   pagination={"page": offset // limit + 1, "per_page": limit,
                               "pages": (total + limit - 1) // limit, "total": total})


@bp.get("/matches/<match_id>")
def match_detail(match_id):
    match = db.session.get(Match, match_id)
    if match is None:
        return jsonify(error="match_not_found"), 404
    return jsonify(serialize_match(match))


@bp.get("/matches/<match_id>/seats")
def match_seats(match_id):
    match = db.session.get(Match, match_id)
    if match is None:
        return jsonify(error="match_not_found"), 404
    seats = db.session.scalars(select(Seat).where(Seat.venue_id == match.venue_id)
                               .order_by(Seat.sector, Seat.row, Seat.number).limit(10000)).all()
    # Without provider-backed inventory, no seat may be represented as purchasable.
    return jsonify(items=[{"id": seat.id, "sector": seat.sector, "row": seat.row,
                           "number": seat.number, "status": "available"} for seat in seats])


@bp.get("/matches/<match_id>/listings")
def match_listings(match_id):
    match = db.session.get(Match, match_id)
    if match is None:
        return jsonify(error="match_not_found"), 404
    # Publishing requires the ticket provider's verified admission transfer.
    # The preview deliberately returns no sellable offers.
    return jsonify(items=[])
