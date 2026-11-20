# Database setup

## Local development

1. Start PostgreSQL using `docker compose up -d db`.
2. Install dependencies with `pip install -r requirements.txt`.
3. Set `DATABASE_URL` and `SECRET_KEY` in your local environment.
4. For a **disposable development database only**, run
   `ALLOW_DEV_DB_BOOTSTRAP=1 python -m scripts.bootstrap_db`.

The bootstrap creates the tables defined in `app/models.py`. It does not
upgrade existing tables or preserve a migration history. **Do not run it
against a production database**.

## Production migration requirements

Before deployment, generate and review an Alembic baseline migration with
Flask-Migrate (`flask --app wsgi:app db init`, `db migrate`, `db upgrade`),
commit the resulting `migrations/` directory, and test upgrading an empty
PostgreSQL database. Subsequent schema changes must use new revisions.
Avoid `db.create_all()` in production because it does not migrate schemas.

The ticket-provider adapter remains disabled: no real ticket issuance,
reservation, or payment processing is enabled.
