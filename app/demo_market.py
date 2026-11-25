"""Strictly isolated fictional inventory; never authorizes real admission."""
import os
from datetime import datetime, timezone
from flask import current_app
from sqlalchemy import select
from app.extensions import db
from app.models import Club, Listing, SeasonTicket, Seat


def demo_enabled(match):
    if current_app.config.get("APP_ENV") != "development" or os.getenv("ALLOW_DEMO_SEED") != "1":
        return False
    club = db.session.get(Club, match.club_id)
    return bool(club and club.slug == "parma-demo" and club.ticket_provider == "mock"
                and match.provider_event_id == "DEMO-FUTURE-001")


def eligible_offers(match):
    if not demo_enabled(match):
        return []
    starts = match.starts_at
    if starts.tzinfo is None:
        starts = starts.replace(tzinfo=timezone.utc)
    if match.status != "scheduled" or starts <= datetime.now(timezone.utc):
        return []
    return db.session.execute(select(Listing, SeasonTicket)
        .join(SeasonTicket, Listing.season_ticket_id == SeasonTicket.id)
        .join(Seat, SeasonTicket.seat_id == Seat.id)
        .where(Listing.match_id == match.id, SeasonTicket.club_id == match.club_id,
               Seat.venue_id == match.venue_id, SeasonTicket.season == "2026/27",
               SeasonTicket.verification_status == "verified",
               SeasonTicket.provider_ticket_id.in_(["DEMO-TICKET-001", "DEMO-TICKET-002"]),
               Listing.status.in_(["published", "reserved", "sold"]))
        .order_by(Listing.id)).all()
