"""Review season-ticket claims without fabricating operator verification."""
from flask import Blueprint, g, jsonify, request
from sqlalchemy import select

from app.auth import require_roles
from app.extensions import db
from app.models import AuditEvent, SeasonTicket

bp = Blueprint("ticket_admin", __name__, url_prefix="/api/admin")


def visible(ticket):
    return g.current_user.role == "platform_admin" or ticket.club_id == g.current_user.club_id


def payload(ticket):
    return {
        "id": ticket.id, "club_id": ticket.club_id, "holder_id": ticket.holder_id,
        "seat_id": ticket.seat_id, "season": ticket.season,
        "verification_status": ticket.verification_status,
    }


@bp.get("/ticket-claims")
@require_roles("club_admin", "platform_admin")
def claims():
    query = select(SeasonTicket)
    if g.current_user.role != "platform_admin":
        if not g.current_user.club_id:
            return jsonify(items=[])
        query = query.where(SeasonTicket.club_id == g.current_user.club_id)
    status = request.args.get("status", "pending")
    if status not in ("pending", "verified", "rejected", "revoked", "all"):
        return jsonify(error="invalid_status"), 400
    if status != "all":
        query = query.where(SeasonTicket.verification_status == status)
    records = db.session.scalars(query.order_by(SeasonTicket.created_at, SeasonTicket.id).limit(100)).all()
    return jsonify(items=[payload(t) for t in records])


@bp.post("/ticket-claims/<ticket_id>/reject")
@require_roles("club_admin", "platform_admin")
def reject_claim(ticket_id):
    ticket = db.session.get(SeasonTicket, ticket_id)
    if ticket is None or not visible(ticket):
        return jsonify(error="claim_not_found"), 404
    if ticket.verification_status != "pending":
        return jsonify(error="claim_not_pending"), 409
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("reason"), str):
        return jsonify(error="reason_required"), 400
    reason = body["reason"].strip()
    if not 3 <= len(reason) <= 500:
        return jsonify(error="reason_required"), 400
    ticket.verification_status = "rejected"
    db.session.add(AuditEvent(
        actor_id=g.current_user.id, entity_type="season_ticket", entity_id=ticket.id,
        action="ticket_claim.rejected", details={"reason": reason},
    ))
    db.session.commit()
    return jsonify(ticket=payload(ticket))


@bp.post("/ticket-claims/<ticket_id>/verify")
@require_roles("club_admin", "platform_admin")
def verify_claim(ticket_id):
    ticket = db.session.get(SeasonTicket, ticket_id)
    if ticket is None or not visible(ticket):
        return jsonify(error="claim_not_found"), 404
    return jsonify(error="ticket_provider_not_connected",
                   message="Only the trusted ticket-provider adapter can verify ownership."), 503
