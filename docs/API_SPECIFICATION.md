# PARMA RESELL — API specification

**API version:** v1  
**Base URL (local):** `http://localhost:5000/api/v1`  
**Transport:** HTTPS in production; JSON; UTF-8.

## 1. Authentication

Access JWT is returned in the JSON response and sent on protected requests as:

```http
Authorization: Bearer <access_token>
```

Access lifetime: 15 minutes. Refresh JWT is set as an HttpOnly cookie for 30 days. The refresh endpoint requires the CSRF cookie/header configured by Flask-JWT-Extended. Logout revokes the current access token and refresh cookie token.

Registration creates the `buyer` role. Seller permission is granted only after an administrator records a verified season ticket. One account can have both roles.

### Register
`POST /auth/register`

```json
{
  "email": "user@example.com",
  "password": "at-least-10-characters",
  "first_name": "Alex",
  "last_name": "Smith"
}
```

### Login
`POST /auth/login`

```json
{"email":"user@example.com","password":"at-least-10-characters"}
```

### Current user
`GET /auth/me`

### Refresh / logout
- `POST /auth/refresh`
- `POST /auth/logout`

## 2. Matches and seats

| Method | Endpoint | Description |
|---|---|---|
| GET | `/matches` | Paginated match list |
| GET | `/matches/{match_id}` | Match detail |
| GET | `/matches/{match_id}/seats` | Arena seat map and per-match status |
| GET | `/matches/{match_id}/listings` | Active listings |

Match filters: `type=home|away`, `status=scheduled|live|finished|cancelled`, `season=<competition substring>`, `page`, `per_page` (maximum 100).

Seat-map statuses: `available`, `active`, `reserved`, `sold`. The response contains seat ID, sector, row and number. Availability is calculated for the selected match, not globally.

## 3. Listings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/listings` | Create listing |
| GET | `/listings/my` | Current user's listings |
| GET | `/listings/{listing_id}` | Listing details |
| PATCH | `/listings/{listing_id}` | Update price |
| DELETE | `/listings/{listing_id}` | Withdraw listing |
| GET | `/seller/season-tickets` | Current user's season tickets |

Create listing:

```json
{
  "match_id": 15,
  "seat_id": 245,
  "season_ticket_id": 9,
  "price": 1500
}
```

The backend verifies that the season ticket belongs to the current user, has status `verified`, and refers to the requested seat. The seat must belong to the match arena, and only scheduled home matches can be listed.

Listing statuses:
- `active` — visible to buyers;
- `reserved` — temporarily held by an order;
- `sold` — payment succeeded in the current test flow;
- `cancelled` — withdrawn by seller;
- `expired` — reserved order expired (order status; listing is returned to active).

Only the owner can edit or withdraw a listing. Only active listings can be edited or withdrawn.

## 4. Seller and buyer cabinets

| Method | Endpoint | Description |
|---|---|---|
| GET | `/seller/dashboard` | Seller summary |
| GET | `/seller/statistics` | Seller statistics |
| GET | `/seller/sales` | Sales and order history |
| GET | `/buyer/dashboard` | Buyer summary |
| GET | `/buyer/orders` | Buyer's order history |
| GET | `/buyer/orders/{order_id}` | Order detail |
| GET | `/buyer/tickets` | Paid purchase records |

A paid purchase record is not a valid arena entry ticket. Actual ticket-right transfer is blocked until the ticket operator integration is approved.

## 5. Orders and payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create order and reserve listing |
| POST | `/orders/{order_id}/cancel` | Cancel unpaid order and release reservation |
| GET | `/orders/{order_id}` | Order detail for buyer or seller |
| GET | `/orders/{order_id}/payment` | Payment status |
| POST | `/orders/{order_id}/payment/test` | Test payment only |

Create order:

```json
{"listing_id": 245}
```

The listing is reserved for 10 minutes (configurable). A buyer cannot purchase their own listing. Expired reservations are released when match listings are read or a new order is attempted.

Test payment request may omit the body (defaults to success), or pass:

```json
{"outcome":"failed"}
```

Allowed outcomes: `succeeded`, `failed`. The endpoint is disabled when `PAYMENT_TEST_MODE=false`. It does not charge a card, move funds, or transfer a ticket.

Order statuses: `pending_payment`, `paid`, `payment_failed`, `cancelled`, `expired`. Listing status changes to `sold` only after the test payment succeeds.

## 6. Administrative endpoints

These endpoints require an administrator JWT. Create the first administrator using the CLI command `flask --app wsgi:app create-admin`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/clubs` | Create club |
| POST | `/admin/arenas` | Create arena |
| POST | `/admin/seats` | Create arena seat |
| POST | `/admin/matches` | Create match |
| POST | `/admin/season-tickets` | Register ticket and record manual verification |

The season-ticket endpoint is an administrative/manual bridge only. It must not be exposed in the public frontend. In production, verification must be performed by a trusted operator integration or controlled back-office process.

## 7. Error format

All application errors use:

```json
{
  "error": {
    "code": "LISTING_NOT_AVAILABLE",
    "message": "Предложение недоступно",
    "details": {}
  }
}
```

Common status codes: 400 malformed request; 401 missing/invalid/expired JWT; 403 forbidden; 404 missing resource; 409 state conflict; 422 validation error; 500 internal error.

## 8. CORS and frontend

Configure `CORS_ORIGINS` as a comma-separated allowlist of exact frontend origins. Credentials are enabled for refresh cookies. Do not use wildcard origins with credentials. For cross-site production deployment configure `JWT_COOKIE_SAMESITE=None` and `JWT_COOKIE_SECURE=true`, and serve both applications over HTTPS.

## 9. OpenAPI

- Swagger UI: `/docs`
- OpenAPI YAML: `/openapi.yaml`

The OpenAPI file is the frontend contract. If a route or response changes, update `docs/openapi.yaml` and this document in the same change.
