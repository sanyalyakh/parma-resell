# PARMA RESELL — integrated MVP v1

**Branch:** `mvp/integrated-v1` (PR #5). This is an isolated integration
candidate based on backend `feature/domain-models`, with the frontend
developer's latest commits from `feature/frontend` reconciled manually.
The developer's branch and `main` are unchanged.

## MVP functionality

- Next.js 16 frontend with match catalog, match detail, interactive demo
  arena layout, registration, login, profile, season tickets and orders.
- Flask backend with PostgreSQL and Alembic migrations.
- Phone/password registration and login; email optional; password >=8.
- Persisted first/last names and editable names/email via
  `PATCH /api/auth/me`. Phone cannot be edited without future SMS OTP.
- Read-only `GET /api/matches`, `GET /api/matches/<id>`,
  `GET /api/matches/<id>/seats`, `GET /api/matches/<id>/listings`.
  Public listing response deliberately empty: provider authorization and
  safe transfer are not implemented. Seat statuses are not live inventory.
- `GET /api/my/tickets`, `GET /api/my/orders`, `GET /api/my/listings`.
- Development-only idempotent demo dataset with one user holding a
  season ticket and a fictional historical purchase.

## Run locally

Use a fresh development PostgreSQL database. Copy `.env.example`
and set `DATABASE_URL` and `SECRET_KEY`. After installing
`requirements.txt`:

```bash
flask --app wsgi:app db upgrade
ALLOW_DEMO_SEED=1 DEMO_USER_PASSWORD=your-local-demo-password flask --app wsgi:app seed-demo
flask --app wsgi:app run --port 5000
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend uses same-origin `/api`
proxy for browser requests and `BACKEND_INTERNAL_URL` (default
`http://127.0.0.1:5000`) for server-side match queries.

**Do not run the phone migration blindly on an existing database with
accounts.** It refuses a populated database until verified phone backfill.
See `docs/demo-data.md`.

## Not production-ready

- No SMS OTP; no automated import of club season tickets.
- No SCENA24 provider contract/adapter, real admission transfer, payment
  collection, refunds or provider-verified seat availability.
- No real published offers or checkout; current match/seat UI is a
  preview, not live ticket inventory.
- Browser token is stored in sessionStorage for local MVP testing. Before
  production use, migrate to hardened HttpOnly sessions and CSRF controls.
- The venue city currently defaults to Perm in the MVP adapter; proper
  venue metadata and complete seat-map import remain to be implemented.
- Run backend tests and frontend lint/build in GitHub Actions; do not
  deploy a failing commit.
