"""Consistent HTTP responses and API discovery for frontend integration."""
from flask import Blueprint, jsonify

bp = Blueprint("api_meta", __name__, url_prefix="/api")


@bp.get("/meta")
def meta():
    return jsonify(
        service="parma-resell",
        api_version="v1-preview",
        features={
            "authentication": True,
            "public_catalog": True,
            "ticket_claims": True,
            "draft_listings": True,
            "club_administration": True,
            "ticket_verification": False,
            "public_listing_sales": False,
            "reservations": False,
            "payments": False,
        },
    )
