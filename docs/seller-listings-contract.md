# Seller listing API

All /api/my endpoints require Bearer authentication. Responses use JSON.

- GET /api/my/tickets: items with id, club_id, seat_id, season, verification_status, sector, row, number, venue_id, venue_name. Seat coordinates are strings.
- GET /api/my/tickets/{ticket_id}/eligible-matches: items with id, club_id, opponent, starts_at (ISO 8601 UTC), status, venue_id, venue_name, match_type. Only verified owned tickets, future scheduled events at the ticket venue and club, excluding every existing listing for the ticket/event pair. Sorted by start time.
- GET /api/matches?club_id=...&venue_id=...: public paginated catalog, includes venue_name. Use eligible-matches for seller selection.
- POST /api/my/listings: JSON season_ticket_id, match_id, price_kopecks (integer 1..100000000). Server derives seat and status. Returns 201 with listing object, always draft.
- GET /api/my/listings: items with id, season_ticket_id, match_id, price_kopecks, status, opponent, starts_at, sector, row, number, season, venue_id, venue_name.

Errors retain existing codes: ticket_not_found (404), ticket_not_verified (409), match_not_found_for_ticket (404), match_not_available (409), listing_already_exists (409), invalid_price / invalid_listing (400). Authentication errors follow existing auth middleware.

The model currently represents home events by club and venue; season-specific entitlement is not yet modeled. No real publication or payment is enabled by this workflow. Existing fictional purchase fixtures remain separate. seed-demo adds three unlisted future events on first run; existing event dates and seller drafts are preserved.
