# Multiple season tickets and verified phone synchronization

- User.phone_e164 is unique and E.164 normalized. Verification is required before lookup.
- The phone OTP is a local development stub only (PHONE_CODE_TEST_MODE=true). It returns test_code in JSON; **never enable in production**. Real SMS integration, anti-abuse and external consent are pending.
- TICKET_PROVIDER=unavailable (default) never claims that PARMA/SCENA24 is connected.
- TICKET_PROVIDER=import uses admin-provided ticket_source_records. Imported tickets are **pending**, not resale-eligible, until authorized ownership verification is agreed with the operator. A matching phone alone is not proof of legal ownership.
- GET /seller/season-tickets returns all owned tickets, with seat, number, source, verification status, and sync status.
- POST /seller/season-tickets/sync rechecks the configured provider; login attempts sync for verified phones.
- Admin may POST /admin/ticket-source-records with phone, external_id, number, seat_id, season, status to seed test records.
- Existing manually verified tickets remain compatible. Never accept arbitrary phone query parameters for ticket lookup.
- Provider contract needed: authoritative ticket identity, owner phone, seat mapping, season, cancellation/transfer state, timestamp, permissions for resale, and signed ownership confirmation. Also need privacy/legal basis and data retention policy.
- Real integration needs webhook or scheduled reconciliation, secure credentials, audit, revocation on phone reassignment, and race-safe listing invalidation.
