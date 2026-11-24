"""Public read-only catalog endpoints."""
from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import Club, Listing, Match, Seat, SeasonTicket

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


def public_match_listings(match):
    return db.session.execute(
        select(Listing, Seat)
        .join(SeasonTicket, Listing.season_ticket_id == SeasonTicket.id)
        .join(Seat, SeasonTicket.seat_id == Seat.id)
        .where(Listing.match_id == match.id,
               SeasonTicket.club_id == match.club_id,
               Seat.venue_id == match.venue_id,
               SeasonTicket.verification_status == "verified",
               Listing.status.in_(("published", "reserved", "sold")))
        .order_by(Listing.id)
    ).all()


@bp.get("/matches/<uuid:match_id>/listings")
def match_listings(match_id):
    match = db.session.get(Match, str(match_id))
    if match is None:
        return jsonify(error="match_not_found"), 404
    return jsonify(items=[{
        "id": listing.id, "match_id": match.id, "seat_id": seat.id,
        "sector": seat.sector, "row": seat.row, "number": seat.number,
        "price_kopecks": listing.price_kopecks, "status": listing.status,
    } for listing, seat in public_match_listings(match)
        if listing.status == "published" and match.status == "scheduled"])


@bp.get("/matches/<uuid:match_id>/seats")
def match_seats(match_id):
    match = db.session.get(Match, str(match_id))
    if match is None:
        return jsonify(error="match_not_found"), 404
    seats = db.session.scalars(select(Seat).where(
        Seat.venue_id == match.venue_id
    ).order_by(Seat.sector, Seat.row, Seat.number, Seat.id)).all()
    by_seat = {}
    priority = {"published": 1, "reserved": 2, "sold": 3}
    for listing, seat in public_match_listings(match):
        previous = by_seat.get(seat.id)
        if previous is None or priority[listing.status] > priority[previous.status]:
            by_seat[seat.id] = listing
    items = []
    for seat in seats:
        listing = by_seat.get(seat.id)
        status = listing.status if listing else "unavailable"
        if status == "published" and match.status != "scheduled":
            status = "unavailable"
        items.append({
            "id": seat.id, "venue_id": seat.venue_id,
            "sector": seat.sector, "row": seat.row, "number": seat.number,
            "status": status,
            "listing_id": listing.id if status == "published" else None,
            "price_kopecks": listing.price_kopecks if status == "published" else None,
        })
    return jsonify(items=items)
