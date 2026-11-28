"""Read-only authenticated purchase history."""
from flask import Blueprint, g, jsonify
from sqlalchemy import select

from app.auth import require_auth
from app.extensions import db
from app.models import Listing, Match, Order

bp = Blueprint("orders", __name__, url_prefix="/api/my")


@bp.get("/orders")
@require_auth
def my_orders():
    rows = db.session.execute(
        select(Order, Listing, Match)
        .join(Listing, Order.listing_id == Listing.id)
        .join(Match, Listing.match_id == Match.id)
        .where(Order.buyer_id == g.current_user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(100)
    ).all()
    return jsonify(items=[
        {"id": order.id, "status": order.status, "amount_kopecks": order.amount_kopecks,
         "listing_id": listing.id, "match_id": match.id, "opponent": match.opponent,
         "starts_at": match.starts_at.isoformat()}
        for order, listing, match in rows
    ])
