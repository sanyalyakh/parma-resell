# Frontend integration handoff (backend preview)

Backend status is discoverable via `GET /api/meta`. Use this endpoint to
disable UI actions that the backend cannot safely complete.

## Authentication

- Register: `POST /api/auth/register`, JSON `{"email":"...","password":"..."}`
- Login: `POST /api/auth/login`, same JSON; response includes `access_token`
- Profile: `GET /api/auth/me` with `Authorization: Bearer <access_token>`
- Tokens expire after 3600 seconds. Do not store passwords or privileged roles
  in the frontend. Authorization is enforced on the server.

## Catalog

- `GET /api/clubs` returns `{"items":[{"id","name","slug"}]}`
- `GET /api/matches?club_id=<uuid>&limit=20&offset=0` returns scheduled
  matches with ISO 8601 `starts_at`.

## Season-ticket holder

- `POST /api/my/tickets` accepts `club_id`, `seat_id`, `season`,
  `provider_ticket_id`; creates an unverified claim.
- `GET /api/my/tickets` lists only the authenticated user's claims.
- `POST /api/my/listings` accepts `season_ticket_id`, `match_id`,
  `price_kopecks` (integer). Only verified claims can create drafts.
- `GET /api/my/listings` lists the holder's drafts and history.
- `POST /api/my/listings/<id>/withdraw` withdraws a draft.

## Club administration

- `POST /api/admin/matches` accepts `club_id`, `venue_id`,
  `opponent`, `starts_at` (timezone-aware ISO 8601).
- `GET /api/admin/ticket-claims?status=pending` lists claims scoped to
  the administrator's club.
- `POST /api/admin/ticket-claims/<id>/reject` accepts `{"reason":"..."}`.
- Verification remains disabled until a trusted ticket-provider adapter exists.

## Errors and disabled flows

Errors are JSON objects with a machine-readable `error` field. Expect
`400` for malformed input, `401` for missing/invalid tokens, `403`
for insufficient privileges, `404` for hidden or missing resources,
`409` for state conflicts and `503` for provider-gated operations.

Reservations, real sales, payments and ticket reissuance are **not enabled**.
The React UI must not imply that draft listings are purchasable.

## Outstanding integration work

Before connecting production UI: agree on API versioning and CORS origin,
implement secure token lifecycle, rate limiting, structured logging,
provider-verified ticket ownership, and production payment controls.
