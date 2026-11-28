# Frontend ↔ backend integration

The existing Next.js UI from `feature/frontend` was merged into
`feature/domain-models` (PR #3). Run the Flask API on port 5000 and Next.js
on port 3000.

```bash
# terminal 1, after setting DATABASE_URL and applying migrations
flask --app wsgi:app db upgrade
flask --app wsgi:app run --port 5000

# terminal 2
cd frontend
npm ci
npm run dev
```

Next.js proxies requests matching `/api/*` to
`BACKEND_INTERNAL_URL` (default `http://127.0.0.1:5000`).
When running Next.js in a container, set `BACKEND_INTERNAL_URL` to
the reachable backend service URL.

Implemented frontend integrations:
- Phone/password login and registration; email optional.
- `GET /api/auth/me` for profile phone/email.
- `GET /api/my/tickets` for season-ticket list.
- `GET /api/my/orders` for purchase history.
- Client-side session storage and logout.

**Remaining limitations:**
- No SMS verification. Do not auto-attach real season tickets to unverified phones.
- The backend does not yet store first/last names or return ticket seat metadata.
- Match/offer cards, seller screen, and detailed match interactions still
  contain frontend demonstration data; they are not live inventory.
- Payments, reservations and real ticket transfer remain disabled.
- Existing populated databases require verified-phone backfill before
  migration 0002; see `docs/demo-data.md`.
- The frontend uses sessionStorage tokens for development; a production
  deployment needs hardened HttpOnly cookie sessions, CSRF defenses,
  and a security review.

Run `npm run lint && npm run build` in `frontend/` before deploying.
