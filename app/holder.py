"""Holder workflows. Provider verification is required before public resale."""
from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth import require_auth
from app.extensions import db
from app.models import Listing, Match, SeasonTicket, Seat

bp = Blueprint("holder", __name__, url_prefix="/api")


def error(message, status):
    return jsonify(error=message), status


def ticket_json(t):
    return {"id": t.id, "club_id": t.club_id, "seat_id": t.seat_id,
            "season": t.season, "verification_status": t.verification_status}


def listing_json(item):
    return {"id": item.id, "match_id": item.match_id,
            "season_ticket_id": item.season_ticket_id,
            "price_kopecks": item.price_kopecks, "status": item.status}


@bp.get("/my/tickets")
@require_auth
def my_tickets():
    records = db.session.scalars(
        select(SeasonTicket).where(SeasonTicket.holder_id == g.current_user.id)
        .order_by(SeasonTicket.created_at, SeasonTicket.id)
    ).all()
    return jsonify(items=[ticket_json(t) for t in records])


@bp.post("/my/tickets")
@require_auth
def claim_ticket():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("invalid_json", 400)
    club_id, seat_id, season, provider_id = (
        payload.get("club_id"), payload.get("seat_id"),
        payload.get("season"), payload.get("provider_ticket_id"),
    )
    if any(not isinstance(x, str) or not x.strip() or len(x) > 150
           for x in (club_id, seat_id, season, provider_id)):
        return error("invalid_ticket_claim", 400)
    if len(club_id) > 36 or len(seat_id) > 36 or len(season) > 20:
        return error("invalid_ticket_claim", 400)
    seat = db.session.get(Seat, seat_id)
    if seat is None or seat.venue.club_id != club_id:
        return error("seat_not_found_for_club", 404)
    ticket = SeasonTicket(
        holder_id=g.current_user.id, club_id=club_id, seat_id=seat_id,
        season=season.strip(), provider_ticket_id=provider_id.strip(),
        verification_status="pending",
    )
    db.session.add(ticket)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error("ticket_already_claimed", 409)
    return jsonify(ticket=ticket_json(ticket)), 201


@bp.get("/my/listings")
@require_auth
def my_listings():
    records = db.session.scalars(
        select(Listing).join(SeasonTicket).where(
            SeasonTicket.holder_id == g.current_user.id
        ).order_by(Listing.created_at, Listing.id)
    ).all()
    return jsonify(items=[listing_json(item) for item in records])


@bp.post("/my/listings")
@require_auth
def create_listing():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("invalid_json", 400)
    ticket_id, match_id, price = (
        payload.get("season_ticket_id"), payload.get("match_id"),
        payload.get("price_kopecks"),
    )
    if not isinstance(ticket_id, str) or not isinstance(match_id, str):
        return error("invalid_listing", 400)
    if type(price) is not int or not 1 <= price <= 100_000_000:
        return error("invalid_price", 400)
    ticket = db.session.get(SeasonTicket, ticket_id)
    if ticket is None or ticket.holder_id != g.current_user.id:
        return error("ticket_not_found", 404)
    if ticket.verification_status != "verified":
        return error("ticket_not_verified", 409)
    match = db.session.get(Match, match_id)
    if match is None or match.club_id != ticket.club_id or match.venue_id != ticket.seat.venue_id:
        return error("match_not_found_for_ticket", 404)
    starts_at = match.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if match.status != "scheduled" or starts_at <= datetime.now(timezone.utc):
        return error("match_not_available", 409)
    # Never publish until the ticketing provider confirms a safe transfer mechanism.
    listing = Listing(season_ticket_id=ticket.id, match_id=match.id,
                      price_kopecks=price, status="draft")
    db.session.add(listing)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error("listing_already_exists", 409)
    return jsonify(listing=listing_json(listing)), 201


@bp.post("/my/listings/<listing_id>/withdraw")
@require_auth
def withdraw_listing(listing_id):
    listing = db.session.get(Listing, listing_id)
    if listing is None or listing.season_ticket.holder_id != g.current_user.id:
        return error("listing_not_found", 404)
    if listing.status not in ("draft", "published"):
        return error("listing_cannot_be_withdrawn", 409)
    # Publishing is not enabled; the future published state needs provider cancellation.
    if listing.status == "published":
        return error("provider_cancellation_required", 409)
    listing.status = "withdrawn"
    db.session.commit()
    return jsonify(listing=listing_json(listing))
