"""Reservation API is deliberately fail-closed until operator integration is certified."""
from flask import Blueprint, jsonify

from app.auth import require_auth

bp = Blueprint("reservations", __name__, url_prefix="/api")


@bp.post("/listings/<listing_id>/reserve")
@require_auth
def reserve(listing_id):
    # Do not create orders or reserve seats until the provider can atomically
    # revoke the original admission right and issue a new one.
    return jsonify(
        error="ticket_provider_not_connected",
        message="Reservations are disabled until ticket-provider integration is certified.",
    ), 503
