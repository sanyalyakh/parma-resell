# Reservation safety design

This document describes the intended implementation, **not an enabled sale flow**.

## Preconditions

- Formal agreement with the club and ticket operator.
- Verified ownership and provider-specific match entitlement.
- Provider support for invalidating the original ticket and issuing a unique
  replacement admission credential, with clear rollback/reconciliation behavior.
- Tested payment-provider callbacks, refunds, and payout handling.
- Production secrets, HTTPS, rate limits, audit events and monitoring.

## Proposed PostgreSQL transaction

1. Authenticate the buyer; validate the published listing and its match.
2. Begin a database transaction and lock the listing row with `SELECT ... FOR UPDATE`.
3. Check listing availability, reservation expiry, and ownership restrictions.
4. Insert a pending order and set the listing to reserved in the same transaction.
5. Enforce uniqueness for active reservations using database constraints or a
   dedicated reservation table. Use idempotency keys for retries.
6. Commit promptly; never hold a database lock while calling external services.
7. Process payment and operator transfer through durable asynchronous state
   transitions with idempotent callbacks and reconciliation.
8. On timeout, release the reservation in a transaction, ensuring that late
   payment callbacks cannot complete an expired order.

**Current behavior:** `POST /api/listings/<id>/reserve` always returns HTTP 503
for authenticated callers. It does not create an order or change a listing.
