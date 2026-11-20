"""Switch user identity from email to normalized phone.

Existing users require a verified phone before migration. Refuse to invent
phone numbers or silently destroy accounts.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_phone_identity"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    existing = conn.execute(sa.text("SELECT COUNT(*) FROM users")).scalar_one()
    if existing:
        raise RuntimeError(
            "Phone migration requires verified phone backfill for existing users; "
            "do not fabricate numbers. Export and reconcile accounts before upgrading."
        )
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("phone", sa.String(16), nullable=False))
        batch.alter_column("email", existing_type=sa.String(254), nullable=True)
        batch.create_index("ix_users_phone", ["phone"], unique=True)


def downgrade():
    conn = op.get_bind()
    missing = conn.execute(sa.text("SELECT COUNT(*) FROM users WHERE email IS NULL")).scalar_one()
    if missing:
        raise RuntimeError("Cannot downgrade while users without email exist")
    with op.batch_alter_table("users") as batch:
        batch.drop_index("ix_users_phone")
        batch.drop_column("phone")
        batch.alter_column("email", existing_type=sa.String(254), nullable=False)
