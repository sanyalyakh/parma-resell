def upgrade():
    op.add_column(
        "users",
        sa.Column("first_name", sa.String(length=100), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("last_name", sa.String(length=100), nullable=True)
    )


def downgrade():
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")