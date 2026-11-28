# PARMA RESELL — registration API contract (MVP v1)

Branch: `mvp/integrated-v1`.

## Database migration

Migration: `migrations/versions/0003_profile_names.py`
Revision: `0003_profile_names`
Depends on: `0002_phone_identity`.

Adds `users.first_name VARCHAR(80) NULL` and
`users.last_name VARCHAR(80) NULL`. Both columns are nullable so
existing users remain intact and have `null` until their profile is
completed. No existing rows are deleted or overwritten.

After backing up your database, run:

```bash
flask --app wsgi:app db upgrade
```

**Important:** the preceding phone migration `0002_phone_identity`
refuses to run against databases that already have users and lack
verified phone backfill. Plan a verified-phone migration for such
databases before running `db upgrade`; do not remove that guard.

## POST /api/auth/register

Content-Type: `application/json`

```json
{
  "first_name": "Иван",
  "last_name": "Петров",
  "phone": "+79991234567",
  "password": "strong-password",
  "email": "ivan@example.com"
}
```

`email` may be omitted or set to `null`. Other fields are required.
`first_name` and `last_name` must each be strings containing
1–80 characters **after trimming surrounding whitespace**. The server
stores trimmed names. The phone is normalized to E.164; Russian
`8 (999) 123-45-67` becomes `+79991234567`. Password length:
8–256 characters. Email, if present, is lowercased and trimmed.

### 201 Created

```json
{
  "user": {
    "id": "<uuid>",
    "first_name": "Иван",
    "last_name": "Петров",
    "phone": "+79991234567",
    "email": "ivan@example.com",
    "role": "buyer",
    "club_id": null
  }
}
```

No access token is returned by registration. Call
`POST /api/auth/login` with `{"phone":"+79991234567","password":"strong-password"}`
after successful registration to receive `access_token` and
`expires_in: 3600`.

### Errors

| HTTP | `error` | Meaning |
| --- | --- | --- |
| 400 | `invalid_json` | Missing/non-object JSON body |
| 400 | `invalid_first_name` | Missing, non-string, blank or >80 characters |
| 400 | `invalid_last_name` | Missing, non-string, blank or >80 characters |
| 400 | `invalid_credentials` | Invalid phone or password length |
| 400 | `invalid_email` | Invalid optional email |
| 409 | `identity_already_registered` | Phone or email already exists |
| 429 | rate-limit error | Registration request limit exceeded |

## GET /api/auth/me

Authorization: `Bearer <access_token>`

Returns the same `user` shape, including `first_name` and
`last_name`. For pre-existing accounts either field may be `null`.
The login endpoint and token format are unchanged.

For profile updates, `PATCH /api/auth/me` accepts
`first_name`, `last_name`, and optional `email`; phone changes
are not permitted via profile edits.

Phone ownership verification by SMS is **not implemented**; do not
automatically attach real club season tickets to unverified numbers.
