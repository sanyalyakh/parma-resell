"""Season ticket synchronization. Provider adapters never trust client-supplied phone numbers."""
from datetime import datetime, timezone
from app.extensions import db
from app.models import Role, SeasonTicket, TicketSourceRecord, TicketSyncLog, Listing


class ProviderUnavailable(Exception):
    pass


def sync_user_tickets(user, provider):
    if not user.phone_e164 or not user.phone_verified_at:
        return {"status": "phone_unverified", "count": 0}
    if provider != "import":
        db.session.add(TicketSyncLog(user_id=user.id, status="unavailable"))
        db.session.commit()
        return {"status": "unavailable", "count": 0}
    records = TicketSourceRecord.query.filter_by(phone_e164=user.phone_e164).all()
    now = datetime.now(timezone.utc)
    seen = set()
    for record in records:
        seen.add(record.external_id)
        ticket = SeasonTicket.query.filter_by(external_id=record.external_id).first()
        if ticket and ticket.owner_id != user.id:
            # Prevent a new phone holder from taking over an active listing.
            active = Listing.query.filter(Listing.season_ticket_id == ticket.id,
                                          Listing.status.in_(["active", "reserved", "sold"])).first()
            if active:
                ticket.status = "pending"
                continue
        if not ticket:
            ticket = SeasonTicket(owner_id=user.id, seat_id=record.seat_id,
                                  external_id=record.external_id)
            db.session.add(ticket)
        ticket.owner_id = user.id
        ticket.seat_id = record.seat_id
        ticket.ticket_number = record.ticket_number
        ticket.season = record.season
        ticket.source = "import"
        ticket.last_synced_at = now
        # Imported records are provisional: source access alone cannot authorize resale.
        ticket.status = "pending" if record.status == "active" else "rejected"
    for ticket in SeasonTicket.query.filter_by(owner_id=user.id, source="import").all():
        if ticket.external_id not in seen:
            ticket.status = "rejected"
    db.session.add(TicketSyncLog(user_id=user.id, status="completed", count=len(records)))
    db.session.commit()
    return {"status": "completed", "count": len(records)}
