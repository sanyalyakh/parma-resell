"""Initial PARMA RESELL domain schema.

Revision ID: 0001_initial
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def timestamps():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def pk():
    return sa.Column("id", sa.String(36), primary_key=True)


def upgrade():
    op.create_table(
        "clubs", pk(), sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("ticket_provider", sa.String(80), nullable=False),
        *timestamps(),
    )
    op.create_table(
        "users", pk(), sa.Column("email", sa.String(254), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("club_id", sa.String(36), sa.ForeignKey("clubs.id")),
        sa.CheckConstraint("role IN ('buyer','holder','club_admin','platform_admin')",
                           name="ck_user_role"), *timestamps(),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "venues", pk(), sa.Column("club_id", sa.String(36), sa.ForeignKey("clubs.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False), *timestamps(),
    )
    op.create_table(
        "seats", pk(), sa.Column("venue_id", sa.String(36), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("sector", sa.String(60), nullable=False),
        sa.Column("row", sa.String(30), nullable=False),
        sa.Column("number", sa.String(30), nullable=False),
        sa.UniqueConstraint("venue_id", "sector", "row", "number", name="uq_seat_position"),
    )
    op.create_table(
        "matches", pk(), sa.Column("club_id", sa.String(36), sa.ForeignKey("clubs.id"), nullable=False),
        sa.Column("venue_id", sa.String(36), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("opponent", sa.String(200), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("provider_event_id", sa.String(150)),
        sa.CheckConstraint("status IN ('scheduled','cancelled','completed')",
                           name="ck_match_status"), *timestamps(),
    )
    op.create_table(
        "season_tickets", pk(),
        sa.Column("holder_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("club_id", sa.String(36), sa.ForeignKey("clubs.id"), nullable=False),
        sa.Column("seat_id", sa.String(36), sa.ForeignKey("seats.id"), nullable=False),
        sa.Column("season", sa.String(20), nullable=False),
        sa.Column("provider_ticket_id", sa.String(150), nullable=False),
        sa.Column("verification_status", sa.String(30), nullable=False),
        sa.UniqueConstraint("club_id", "season", "seat_id", name="uq_ticket_season_seat"),
        sa.UniqueConstraint("club_id", "provider_ticket_id", name="uq_provider_season_ticket"),
        sa.CheckConstraint("verification_status IN ('pending','verified','rejected','revoked')",
                           name="ck_ticket_verification"), *timestamps(),
    )
    op.create_table(
        "listings", pk(),
        sa.Column("season_ticket_id", sa.String(36), sa.ForeignKey("season_tickets.id"), nullable=False),
        sa.Column("match_id", sa.String(36), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("price_kopecks", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.UniqueConstraint("season_ticket_id", "match_id", name="uq_listing_ticket_match"),
        sa.CheckConstraint("price_kopecks > 0", name="ck_listing_positive_price"),
        sa.CheckConstraint("status IN ('draft','published','reserved','sold','withdrawn','expired')",
                           name="ck_listing_status"), *timestamps(),
    )
    op.create_table(
        "orders", pk(),
        sa.Column("listing_id", sa.String(36), sa.ForeignKey("listings.id"), nullable=False),
        sa.Column("buyer_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount_kopecks", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("reservation_expires_at", sa.DateTime(timezone=True)),
        sa.Column("provider_transfer_id", sa.String(150)),
        sa.Column("idempotency_key", sa.String(120), unique=True),
        sa.CheckConstraint("amount_kopecks > 0", name="ck_order_positive_amount"),
        sa.CheckConstraint("status IN ('pending','payment_pending','paid','transfer_pending','completed','failed','cancelled','refunded')",
                           name="ck_order_status"), *timestamps(),
    )
    op.create_table(
        "audit_events", pk(),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("entity_type", sa.String(60), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    for table in ("audit_events", "orders", "listings", "season_tickets",
                  "matches", "seats", "venues", "users", "clubs"):
        op.drop_table(table)
