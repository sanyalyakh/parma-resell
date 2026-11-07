# PARMA RESELL — backend architecture

## Scope

Flask + SQLAlchemy + PostgreSQL. REST API will be the interface for a separately developed frontend. IDs are UUID strings; prices are integer kopecks, never floats.

## Domain

- Club, Venue, Seat: multi-club seating structure.
- User: buyer, holder, club_admin, platform_admin.
- SeasonTicket: ownership claim and independent provider verification state.
- Match: a specific home event.
- Listing: resale offer for exactly one season ticket and match.
- Order: buyer's purchase and the transfer lifecycle.
- AuditEvent: append-only application-level history.

Schema-level uniqueness and check constraints are a first layer of protection, not a substitute for transactional business logic. Subsequent phases must enforce matching club/venue, verified ownership, allowed transitions, listing locks and reservation expiry.

## Integration safety

SCENA24 is the authoritative source of admission rights. The application must never issue an independently valid admission credential or mark transfer completed solely because a payment succeeded. Until SCENA24 provides documented revoke/transfer/issue operations, use a mock adapter in tests only. No live payment, real resale or real transfer is enabled by this phase.

## Development workflow

Feature branch: `feature/domain-models`. Run `pytest` for unit tests. Generate and review Alembic migrations with `flask --app wsgi:app db migrate -m "initial schema"` against a running PostgreSQL instance, then `flask --app wsgi:app db upgrade`. Do not apply generated migrations to production without review.
