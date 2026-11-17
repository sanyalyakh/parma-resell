from app.extensions import db


user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now(),
        onupdate=db.func.now(), nullable=False,
    )


class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), unique=True, nullable=False)


class User(TimestampMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    roles = db.relationship("Role", secondary=user_roles, lazy="joined")
    phone_e164 = db.Column(db.String(20), unique=True, index=True)
    phone_verified_at = db.Column(db.DateTime(timezone=True))
    listings = db.relationship("Listing", back_populates="seller", foreign_keys="Listing.seller_id")
    orders = db.relationship("Order", back_populates="buyer", foreign_keys="Order.buyer_id")

    def has_role(self, role):
        return any(item.name == role for item in self.roles)


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"
    jti = db.Column(db.String(36), primary_key=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)


class Club(TimestampMixin, db.Model):
    __tablename__ = "clubs"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    short_name = db.Column(db.String(50))
    external_id = db.Column(db.String(100), unique=True)


class Arena(TimestampMixin, db.Model):
    __tablename__ = "arenas"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer)


class Seat(TimestampMixin, db.Model):
    __tablename__ = "seats"
    id = db.Column(db.Integer, primary_key=True)
    arena_id = db.Column(db.Integer, db.ForeignKey("arenas.id"), nullable=False, index=True)
    sector = db.Column(db.String(30), nullable=False)
    row = db.Column(db.String(20), nullable=False)
    number = db.Column(db.String(20), nullable=False)
    arena = db.relationship("Arena")
    __table_args__ = (db.UniqueConstraint("arena_id", "sector", "row", "number", name="uq_arena_seat"),)


class Match(TimestampMixin, db.Model):
    __tablename__ = "matches"
    id = db.Column(db.Integer, primary_key=True)
    home_club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)
    away_club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)
    arena_id = db.Column(db.Integer, db.ForeignKey("arenas.id"), nullable=False)
    starts_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    competition = db.Column(db.String(150), nullable=False)
    match_type = db.Column(db.String(20), nullable=False, default="home")
    status = db.Column(db.String(20), nullable=False, default="scheduled")
    home_club = db.relationship("Club", foreign_keys=[home_club_id])
    away_club = db.relationship("Club", foreign_keys=[away_club_id])
    arena = db.relationship("Arena")


class SeasonTicket(TimestampMixin, db.Model):
    __tablename__ = "season_tickets"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    seat_id = db.Column(db.Integer, db.ForeignKey("seats.id"), nullable=False)
    external_id = db.Column(db.String(150), unique=True)
    ticket_number = db.Column(db.String(150))
    season = db.Column(db.String(30))
    source = db.Column(db.String(40), nullable=False, default="manual")
    last_synced_at = db.Column(db.DateTime(timezone=True))
    status = db.Column(db.String(20), nullable=False, default="pending")
    verified_at = db.Column(db.DateTime(timezone=True))
    owner = db.relationship("User")
    seat = db.relationship("Seat")


class Listing(TimestampMixin, db.Model):
    __tablename__ = "listings"
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    season_ticket_id = db.Column(db.Integer, db.ForeignKey("season_tickets.id"), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey("matches.id"), nullable=False, index=True)
    seat_id = db.Column(db.Integer, db.ForeignKey("seats.id"), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="RUB")
    status = db.Column(db.String(20), nullable=False, default="active", index=True)
    reserved_until = db.Column(db.DateTime(timezone=True))
    seller = db.relationship("User", back_populates="listings", foreign_keys=[seller_id])
    season_ticket = db.relationship("SeasonTicket")
    match = db.relationship("Match")
    seat = db.relationship("Seat")
    __table_args__ = (
        db.CheckConstraint("price > 0", name="ck_listing_positive_price"),
        db.Index(
            "uq_open_listing_match_seat", "match_id", "seat_id", unique=True,
            postgresql_where=db.text("status IN ('active', 'reserved', 'sold')"),
            sqlite_where=db.text("status IN ('active', 'reserved', 'sold')"),
        ),
    )


class Order(TimestampMixin, db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="RUB")
    status = db.Column(db.String(30), nullable=False, default="pending_payment", index=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    paid_at = db.Column(db.DateTime(timezone=True))
    buyer = db.relationship("User", back_populates="orders", foreign_keys=[buyer_id])
    listing = db.relationship("Listing")


class Payment(TimestampMixin, db.Model):
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, unique=True)
    provider = db.Column(db.String(50), nullable=False, default="test")
    provider_payment_id = db.Column(db.String(150), unique=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="RUB")
    status = db.Column(db.String(20), nullable=False, default="pending")
    order = db.relationship("Order")


class EventLog(db.Model):
    __tablename__ = "event_logs"
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(100), nullable=False)
    payload = db.Column(db.JSON, nullable=False, default=dict)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)


class PhoneVerification(db.Model):
    __tablename__ = "phone_verifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    phone_e164 = db.Column(db.String(20), nullable=False)
    code_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)


class TicketSourceRecord(db.Model):
    """Admin-imported, untrusted until an authorized source has been established."""
    __tablename__ = "ticket_source_records"
    id = db.Column(db.Integer, primary_key=True)
    phone_e164 = db.Column(db.String(20), nullable=False, index=True)
    external_id = db.Column(db.String(150), nullable=False, unique=True)
    ticket_number = db.Column(db.String(150), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seats.id"), nullable=False)
    season = db.Column(db.String(30))
    status = db.Column(db.String(20), nullable=False, default="active")


class TicketSyncLog(db.Model):
    __tablename__ = "ticket_sync_logs"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(30), nullable=False)
    count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
