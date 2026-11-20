# Demo dataset and phone authentication

## Phone login

Registration: `POST /api/auth/register` with JSON
`{"phone":"+79991234567","password":"at-least-eight","email":"optional@example.com"}`.
Email may be omitted entirely. Login: `POST /api/auth/login` with
`{"phone":"+79991234567","password":"at-least-eight"}`.
Russian phone numbers starting with `8` are normalized to `+7`;
international numbers are accepted in E.164 form.

**Important:** a password plus a supplied number does not prove ownership
of the phone. Before connecting real season tickets by phone, implement SMS
OTP verification and provider-backed account matching. No automatic ticket
discovery is enabled.

## Schema migration

Run `flask --app wsgi:app db upgrade` after taking a database backup.
Revision `0002_phone_identity` deliberately **refuses to upgrade a database
that already contains user accounts**. Existing accounts must first be
reconciled with verified phone numbers. Never assign arbitrary numbers to
existing users. A dedicated backfill migration will be required for a
populated production database.

## Create fictional test records

On a **fresh migrated development database**, set environment variables:

```bash
ALLOW_DEMO_SEED=1
DEMO_USER_PASSWORD=<choose-a-local-password-of-at-least-8-characters>
flask --app wsgi:app seed-demo
```

The command is idempotent. It creates a demo club and arena, two sample
season tickets, a past completed demo match, a future scheduled demo match,
a draft listing, a fictional completed purchase from a different demo
holder, and an account with both a season ticket and purchase history.

Demo login phone: `+79990000001`. The password is whatever was set in
`DEMO_USER_PASSWORD`; **no password is committed to GitHub**.

The command is disabled in production. All identifiers are marked DEMO;
no real ticket rights, provider transfers or payments are created.
