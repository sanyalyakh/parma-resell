"""Explicit development-only sample dataset; never real sales or ticket rights."""
import os
from datetime import datetime, timedelta, timezone

import click
from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy import select
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Club, Listing, Match, Order, Seat, SeasonTicket, User, Venue


@click.command("seed-demo")
@with_appcontext
def seed_demo():
    """Create a fictional match, test account, ticket and completed order."""
    if current_app.config.get("APP_ENV") == "production" or os.getenv("ALLOW_DEMO_SEED") != "1":
        raise click.ClickException("Demo seed disabled: set ALLOW_DEMO_SEED=1 outside production")
    password = os.getenv("DEMO_USER_PASSWORD", "")
    if len(password) < 8:
        raise click.ClickException("Set DEMO_USER_PASSWORD (at least 8 characters)")
    phone = "+79990000001"
    club = db.session.scalar(select(Club).where(Club.slug == "parma-demo"))
    if club is None:
        club = Club(name="PARMA (DEMO)", slug="parma-demo", ticket_provider="mock")
        db.session.add(club)
        db.session.flush()
    venue = db.session.scalar(select(Venue).where(Venue.club_id == club.id, Venue.name == "Demo arena"))
    if venue is None:
        venue = Venue(club_id=club.id, name="Demo arena")
        db.session.add(venue)
        db.session.flush()
    seat = db.session.scalar(select(Seat).where(Seat.venue_id == venue.id, Seat.sector == "A", Seat.row == "1", Seat.number == "12"))
    if seat is None:
        seat = Seat(venue_id=venue.id, sector="A", row="1", number="12")
        db.session.add(seat)
        db.session.flush()
    user = db.session.scalar(select(User).where(User.phone == phone))
    if user is None:
        user = User(phone=phone, email=None, password_hash=generate_password_hash(password), role="holder")
        db.session.add(user)
        db.session.flush()
    elif user.role != "holder":
        raise click.ClickException("Demo phone belongs to another account; refusing to modify it")
    ticket = db.session.scalar(select(SeasonTicket).where(SeasonTicket.club_id == club.id, SeasonTicket.provider_ticket_id == "DEMO-TICKET-001"))
    if ticket is None:
        ticket = SeasonTicket(holder_id=user.id, club_id=club.id, seat_id=seat.id, season="2026/27",
                              provider_ticket_id="DEMO-TICKET-001", verification_status="verified")
        db.session.add(ticket)
        db.session.flush()
    seller = db.session.scalar(select(User).where(User.phone == "+79990000002"))
    if seller is None:
        seller = User(phone="+79990000002", password_hash=generate_password_hash(password), role="holder")
        db.session.add(seller)
        db.session.flush()
    seller_seat = db.session.scalar(select(Seat).where(Seat.venue_id == venue.id, Seat.sector == "A", Seat.row == "1", Seat.number == "13"))
    if seller_seat is None:
        seller_seat = Seat(venue_id=venue.id, sector="A", row="1", number="13")
        db.session.add(seller_seat)
        db.session.flush()
    seller_ticket = db.session.scalar(select(SeasonTicket).where(SeasonTicket.club_id == club.id, SeasonTicket.provider_ticket_id == "DEMO-TICKET-002"))
    if seller_ticket is None:
        seller_ticket = SeasonTicket(holder_id=seller.id, club_id=club.id, seat_id=seller_seat.id, season="2026/27", provider_ticket_id="DEMO-TICKET-002", verification_status="verified")
        db.session.add(seller_ticket)
        db.session.flush()
    now = datetime.now(timezone.utc)
    for event_id, opponent, starts, state in (
        ("DEMO-PAST-001", "УНИКС (демо)", now - timedelta(days=14), "completed"),
        ("DEMO-FUTURE-001", "ЦСКА (демо)", now + timedelta(days=14), "scheduled"),
    ):
        match = db.session.scalar(select(Match).where(Match.club_id == club.id, Match.provider_event_id == event_id))
        if match is None:
            match = Match(club_id=club.id, venue_id=venue.id, opponent=opponent,
                          starts_at=starts, status=state, provider_event_id=event_id)
            db.session.add(match)
            db.session.flush()
        listing_ticket = seller_ticket if state == "completed" else ticket
        listing = db.session.scalar(select(Listing).where(Listing.season_ticket_id == listing_ticket.id, Listing.match_id == match.id))
        if listing is None:
            listing = Listing(season_ticket_id=listing_ticket.id, match_id=match.id,
                              price_kopecks=150000, status="sold" if state == "completed" else "draft")
            db.session.add(listing)
            db.session.flush()
        if state == "completed":
            order = db.session.scalar(select(Order).where(Order.idempotency_key == "DEMO-ORDER-001"))
            if order is None:
                db.session.add(Order(listing_id=listing.id, buyer_id=user.id, amount_kopecks=150000,
                                     status="completed", provider_transfer_id="DEMO-TRANSFER-001",
                                     idempotency_key="DEMO-ORDER-001"))
    # Only publish fictional offers for the designated demo event.
    future = db.session.scalar(select(Match).where(Match.club_id == club.id,
        Match.provider_event_id == "DEMO-FUTURE-001"))
    if club.ticket_provider == "mock" and future.status == "scheduled":
        for demo_ticket, price in ((ticket, 150000), (seller_ticket, 140000)):
            if demo_ticket.verification_status != "verified":
                continue
            offer = db.session.scalar(select(Listing).where(
                Listing.match_id == future.id, Listing.season_ticket_id == demo_ticket.id))
            if offer is None:
                db.session.add(Listing(match_id=future.id, season_ticket_id=demo_ticket.id,
                    price_kopecks=price, status="published"))
            elif offer.status == "draft":
                offer.status = "published"
        for number in ("14", "15"):
            if db.session.scalar(select(Seat).where(Seat.venue_id == venue.id,
                    Seat.sector == "A", Seat.row == "1", Seat.number == number)) is None:
                db.session.add(Seat(venue_id=venue.id, sector="A", row="1", number=number))
    # Additional fixtures for seller drafts; never publish offers for these events.
    for event_id, opponent, days in (
        ("DEMO-SELLER-001", "Зенит (демо)", 21),
        ("DEMO-SELLER-002", "Локомотив-Кубань (демо)", 28),
        ("DEMO-SELLER-003", "УНИКС (демо)", 35),
    ):
        event = db.session.scalar(select(Match).where(
            Match.club_id == club.id, Match.provider_event_id == event_id))
        if event is None:
            db.session.add(Match(club_id=club.id, venue_id=venue.id,
                opponent=opponent, starts_at=now + timedelta(days=days),
                status="scheduled", provider_event_id=event_id))
    db.session.commit()
    click.echo("Demo data ready: phone +79990000001; password from DEMO_USER_PASSWORD")


def init_app(app):
    app.cli.add_command(seed_demo)
