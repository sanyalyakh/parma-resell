"""Core domain schema. Monetary values are stored in integer kopecks."""
from datetime import datetime, timezone
from uuid import uuid4

from app.extensions import db


def new_id():
    return str(uuid4())


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Club(TimestampMixin, db.Model):
    __tablename__ = "clubs"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    ticket_provider = db.Column(db.String(80), nullable=False, default="mock")


class User(TimestampMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="buyer")
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id"))
    __table_args__ = (db.CheckConstraint("role IN ('buyer','holder','club_admin','platform_admin')", name="ck_user_role"),)


class Venue(TimestampMixin, db.Model):
    __tablename__ = "venues"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)


class Seat(db.Model):
    __tablename__ = "seats"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    venue_id = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    sector = db.Column(db.String(60), nullable=False)
    row = db.Column(db.String(30), nullable=False)
    number = db.Column(db.String(30), nullable=False)
    __table_args__ = (db.UniqueConstraint("venue_id", "sector", "row", "number", name="uq_seat_position"),)


class Match(TimestampMixin, db.Model):
    __tablename__ = "matches"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id"), nullable=False)
    venue_id = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    opponent = db.Column(db.String(200), nullable=False)
    starts_at = db.Column(db.DateTime(timezone=True), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="scheduled")
    provider_event_id = db.Column(db.String(150))
    __table_args__ = (db.CheckConstraint("status IN ('scheduled','cancelled','completed')", name="ck_match_status"),)


class SeasonTicket(TimestampMixin, db.Model):
    __tablename__ = "season_tickets"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    holder_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id"), nullable=False)
    seat_id = db.Column(db.String(36), db.ForeignKey("seats.id"), nullable=False)
    season = db.Column(db.String(20), nullable=False)
    provider_ticket_id = db.Column(db.String(150), nullable=False)
    verification_status = db.Column(db.String(30), nullable=False, default="pending")
    __table_args__ = (
        db.UniqueConstraint("club_id", "season", "seat_id", name="uq_ticket_season_seat"),
        db.UniqueConstraint("club_id", "provider_ticket_id", name="uq_provider_season_ticket"),
        db.CheckConstraint("verification_status IN ('pending','verified','rejected','revoked')", name="ck_ticket_verification"),
    )


class Listing(TimestampMixin, db.Model):
    __tablename__ = "listings"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    season_ticket_id = db.Column(db.String(36), db.ForeignKey("season_tickets.id"), nullable=False)
    match_id = db.Column(db.String(36), db.ForeignKey("matches.id"), nullable=False)
    price_kopecks = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="draft")
    __table_args__ = (
        db.UniqueConstraint("season_ticket_id", "match_id", name="uq_listing_ticket_match"),
        db.CheckConstraint("price_kopecks > 0", name="ck_listing_positive_price"),
        db.CheckConstraint("status IN ('draft','published','reserved','sold','withdrawn','expired')", name="ck_listing_status"),
    )


class Order(TimestampMixin, db.Model):
    __tablename__ = "orders"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    listing_id = db.Column(db.String(36), db.ForeignKey("listings.id"), nullable=False)
    buyer_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    amount_kopecks = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pending")
    reservation_expires_at = db.Column(db.DateTime(timezone=True))
    provider_transfer_id = db.Column(db.String(150))
    idempotency_key = db.Column(db.String(120), unique=True)
    __table_args__ = (
        db.CheckConstraint("amount_kopecks > 0", name="ck_order_positive_amount"),
        db.CheckConstraint("status IN ('pending','payment_pending','paid','transfer_pending','completed','failed','cancelled','refunded')", name="ck_order_status"),
    )


class AuditEvent(db.Model):
    __tablename__ = "audit_events"
    id = db.Column(db.String(36), primary_key=True, default=new_id)
    actor_id = db.Column(db.String(36), db.ForeignKey("users.id"))
    entity_type = db.Column(db.String(60), nullable=False)
    entity_id = db.Column(db.String(36), nullable=False)
    action = db.Column(db.String(80), nullable=False)
    details = db.Column(db.JSON, nullable=False, default=dict)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
