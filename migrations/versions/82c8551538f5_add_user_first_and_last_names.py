"""Add optional first and last names to users.

Revision ID: 82c8551538f5
Revises: 0002_phone_identity
"""
from alembic import op
import sqlalchemy as sa

revision = "82c8551538f5"
down_revision = "0002_phone_identity"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))


def downgrade():
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
