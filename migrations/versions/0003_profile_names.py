"""Add optional first and last names for frontend profile editing."""
from alembic import op
import sqlalchemy as sa

revision = "0003_profile_names"
down_revision = "0002_phone_identity"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("first_name", sa.String(80), nullable=True))
        batch.add_column(sa.Column("last_name", sa.String(80), nullable=True))


def downgrade():
    with op.batch_alter_table("users") as batch:
        batch.drop_column("last_name")
        batch.drop_column("first_name")
