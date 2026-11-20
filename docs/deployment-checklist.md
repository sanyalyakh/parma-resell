# Backend deployment checks

## Runtime

Use Gunicorn (the Dockerfile default), not the Flask development server.
Apply schema migrations before routing requests to the new release:

```bash
flask --app wsgi:app db upgrade
```

Set `APP_ENV=production`, a randomly generated `SECRET_KEY` of at least
32 characters, `DATABASE_URL` pointing to a managed PostgreSQL instance,
and `RATELIMIT_STORAGE_URI=redis://...` or `rediss://...` pointing to
shared Redis. Store secrets outside the repository.

## Health endpoints

- `GET /api/health`: process liveness; does not query external dependencies.
- `GET /api/ready`: database readiness. Returns HTTP 200 when a simple
  database query succeeds, HTTP 503 when the database is unavailable.
- `GET /api/meta`: advertises disabled provider-gated functionality.

A successful readiness probe **does not** imply that payment or ticket-provider
integration is available. Those capabilities remain disabled until verified.

## Production gates

Do not enable real ticket sales until the ticket provider confirms ownership
and guarantees invalidation of the original admission right before issuing a
new one. Payment processing additionally requires provider contracts,
idempotent callbacks, reconciliation, refunds, and an operational runbook.

Run the full test suite and verify migration upgrade on a clean PostgreSQL
database before deploying each revision.
