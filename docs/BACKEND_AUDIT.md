# PARMA RESELL — backend audit

Audit date: 2026-11-17  
Audited branch: `backend/api-foundation`  
Baseline: `main` contained a Flask app factory, SQLAlchemy/Migrate extensions, a root route, health route, Docker setup and one health test. The domain models and user-facing API were not yet present in the audited main snapshot.

## Implemented in this branch

- JWT access authentication, refresh cookie, logout token blocklist and `/auth/me`.
- Buyer role at registration; seller role is assigned only when an administrator records a verified season ticket.
- SQLAlchemy models: User, Role, TokenBlocklist, Club, Arena, Seat, Match, SeasonTicket, Listing, Order, Payment and EventLog.
- Match catalogue, match detail, match seat map, public listing search.
- Listing create/read/update/withdraw; seller ownership and season-ticket/seat checks.
- Seller dashboard, statistics, sales history and season-ticket list.
- Buyer dashboard, order history, order detail and paid purchase records.
- Order creation, temporary listing reservation, test success/failure payment flow and lazy expiration of stale reservations.
- Protected admin endpoints to populate clubs, arenas, seats, matches and season-ticket verification records.
- CORS allowlist, common error shape, Swagger UI and OpenAPI 3.1 contract.
- GitHub Actions workflow running pytest.

## Explicitly not production-ready

1. No official СЦЕНА24 API contract, credentials or sandbox. No real ticket verification, lock, cancellation, transfer or duplicate-entry protection is possible yet.
2. No real payment provider, webhook signature validation, refund execution, seller payout or reconciliation.
3. No scheduled worker for reservation expiration. Expired holds are released lazily during selected API requests; production needs a scheduler/queue.
4. No full admin UI, user email verification, password reset, rate limiting at reverse proxy, audit-log viewer or operational monitoring.
5. No club/arena/match import integration. The initial catalogue must be populated by an administrator or future trusted import.
6. A temporary configurable maximum listing price exists; the final price ceiling, commission allocation and payout rules require business approval and are not yet applied.
7. The OpenAPI document is a first contract draft and should be kept in sync with route changes.

## Before production

- Obtain and implement the official ticket operator workflow; make ticket-right transfer the final transaction step.
- Select a payment provider and implement idempotent payment intents, signed webhooks, refunds and payout ledger.
- Add reservation worker, idempotency keys, stronger concurrency tests and PostgreSQL integration tests.
- Configure production secrets, HTTPS, exact CORS origins, secure cookie settings, database backups and monitoring.
- Review personal-data processing, terms of sale, seller/buyer dispute process and financial/legal requirements.
