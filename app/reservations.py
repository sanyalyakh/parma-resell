"""Fictional demo reservations and checkout; real provider operations fail closed."""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, g, jsonify
from sqlalchemy import select, update
from app.auth import require_auth
from app.extensions import db
from app.models import Listing, Match, Order
from app.demo_market import demo_enabled, eligible_offers

bp = Blueprint("reservations", __name__, url_prefix="/api")


def fail(code, status):
    db.session.rollback()
    return jsonify(error=code), status


def utc(value):
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


@bp.post("/listings/<listing_id>/reserve")
@require_auth
def reserve(listing_id):
    listing = db.session.get(Listing, listing_id)
    match = db.session.get(Match, listing.match_id) if listing else None
    if match is None or not demo_enabled(match):
        return fail("ticket_provider_not_connected", 503)
    pair = next(((offer, ticket) for offer, ticket in eligible_offers(match)
                 if offer.id == listing_id), None)
    if pair is None or listing.status != "published":
        return fail("listing_unavailable", 409)
    if pair[1].holder_id == g.current_user.id:
        return fail("cannot_buy_own_listing", 409)
    changed = db.session.execute(update(Listing).where(Listing.id == listing_id,
        Listing.status == "published").values(status="reserved"))
    if changed.rowcount != 1:
        return fail("listing_unavailable", 409)
    order = Order(listing_id=listing_id, buyer_id=g.current_user.id,
                  amount_kopecks=listing.price_kopecks, status="pending",
                  reservation_expires_at=datetime.now(timezone.utc) + timedelta(minutes=10))
    db.session.add(order)
    db.session.commit()
    return jsonify(order={"id": order.id, "listing_id": listing_id, "status": order.status,
        "amount_kopecks": order.amount_kopecks,
        "reservation_expires_at": order.reservation_expires_at.isoformat(), "demo": True}), 201


@bp.post("/orders/<order_id>/demo-confirm")
@require_auth
def confirm(order_id):
    order = db.session.scalar(select(Order).where(Order.id == order_id,
        Order.buyer_id == g.current_user.id).with_for_update())
    if order is None:
        return fail("order_not_found", 404)
    listing = db.session.scalar(select(Listing).where(Listing.id == order.listing_id).with_for_update())
    match = db.session.get(Match, listing.match_id)
    if not demo_enabled(match):
        return fail("ticket_provider_not_connected", 503)
    if order.status == "completed":
        return jsonify(order={"id": order.id, "status": "completed", "demo": True})
    if order.status != "pending" or listing.status != "reserved":
        return fail("order_unavailable", 409)
    if utc(order.reservation_expires_at) <= datetime.now(timezone.utc):
        order.status = "cancelled"
        listing.status = "published"
        db.session.commit()
        return jsonify(error="reservation_expired"), 409
    if not any(offer.id == listing.id for offer, _ in eligible_offers(match)):
        return fail("listing_unavailable", 409)
    order.status = "completed"
    listing.status = "sold"
    db.session.commit()
    return jsonify(order={"id": order.id, "status": order.status,
                          "amount_kopecks": order.amount_kopecks, "demo": True})
